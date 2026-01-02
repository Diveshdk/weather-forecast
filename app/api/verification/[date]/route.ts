import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * GET /api/verification/[date]
 * Lazy-loads verification data for a specific date
 * Uses cached data if available, otherwise calculates on-demand
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { date } = await context.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const verificationFile = path.join(dataDir, 'verification', `${date}.json`);
    
    // Check if cached verification exists
    try {
      await fs.access(verificationFile);
      // Return cached data
      const cachedData = await fs.readFile(verificationFile, 'utf-8');
      const result = JSON.parse(cachedData);
      
      return NextResponse.json({
        success: true,
        cached: true,
        ...result
      });
    } catch {
      // No cache, calculate on-demand
    }
    
    // Calculate verification for this date
    const pythonCommand = `cd ${process.cwd()} && source .venv/bin/activate && python3 -c "
import sys
sys.path.append('app/utils')
from heavyRainfallVerifier import HeavyRainfallVerifier
from storageManager import StorageManager
import json

# Extract year and month from date
date_parts = '${date}'.split('-')
year = int(date_parts[0])
month = int(date_parts[1])

# Load data from storage
storage = StorageManager('data')
forecast_data = storage.load_forecast_data(year, month)
realised_data = storage.load_realised_data(year, month)

if not forecast_data or not realised_data:
    print(json.dumps({'success': False, 'error': 'No data available for this month'}))
    sys.exit(0)

# Run verification for this specific date only
verifier = HeavyRainfallVerifier(heavy_threshold=64.5)

# Verify single date
from datetime import datetime
verification_results = []

# Get all forecast districts
forecast_districts = set(forecast_data.keys())

for district in forecast_districts:
    # Try to find matching observed district
    observed_district = verifier.parser.map_district_name(district, list(realised_data.keys()))
    
    if not observed_district:
        continue
    
    # Get observed rainfall for this date
    if '${date}' not in realised_data[observed_district]:
        continue
    
    observed_rainfall = realised_data[observed_district]['${date}']
    observed_heavy = verifier.parser.is_heavy_rainfall_observed(observed_rainfall)
    
    # Verify each lead time (Day-1 to Day-5)
    for lead_days in range(1, 6):
        # Get forecast for this lead time
        forecast_code = verifier.parser.get_forecast_for_verification(
            forecast_data, district, '${date}', lead_days
        )
        
        if forecast_code is None:
            continue
        
        forecast_heavy = verifier.parser.is_heavy_rainfall_forecast(forecast_code)
        
        # Perform verification
        result_type, description = verifier.verify_single_prediction(
            forecast_code, observed_rainfall
        )
        
        verification_results.append({
            'district': district,
            'date': '${date}',
            'lead_days': lead_days,
            'forecast_code': forecast_code,
            'forecast_heavy': forecast_heavy,
            'observed_rainfall': observed_rainfall,
            'observed_heavy': observed_heavy,
            'result_type': result_type,
            'result_description': description
        })

# Build date-specific result
def build_lead_time_table(results, lead_days):
    lead_results = [r for r in results if r['lead_days'] == lead_days]
    
    verifications = []
    for r in lead_results:
        verifications.append({
            'district': r['district'],
            'forecastHeavy': r['forecast_heavy'],
            'forecastRainfall': r['forecast_code'],
            'observedHeavy': r['observed_heavy'],
            'observedRainfall': r['observed_rainfall'],
            'result': r['result_type']
        })
    
    # Calculate stats
    hits = len([r for r in lead_results if r['result_type'] == 'Hit'])
    misses = len([r for r in lead_results if r['result_type'] == 'Miss'])
    false_alarms = len([r for r in lead_results if r['result_type'] == 'False Alarm'])
    correct_negatives = len([r for r in lead_results if r['result_type'] == 'Correct Negative'])
    total = len(lead_results)
    accuracy = ((hits + correct_negatives) / total * 100) if total > 0 else 0.0
    
    return {
        'verifications': verifications,
        'statistics': {
            'hits': hits,
            'misses': misses,
            'falseAlarms': false_alarms,
            'correctNegatives': correct_negatives,
            'total': total,
            'accuracy': accuracy
        }
    }

# Build all tables
output = {
    'success': True,
    'date': '${date}',
    'cached': False,
    'day1': build_lead_time_table(verification_results, 1),
    'day2': build_lead_time_table(verification_results, 2),
    'day3': build_lead_time_table(verification_results, 3),
    'day4': build_lead_time_table(verification_results, 4),
    'day5': build_lead_time_table(verification_results, 5)
}

# Build overall table (all lead times)
all_verifications = []
for r in verification_results:
    all_verifications.append({
        'district': r['district'],
        'forecastHeavy': r['forecast_heavy'],
        'forecastRainfall': r['forecast_code'],
        'observedHeavy': r['observed_heavy'],
        'observedRainfall': r['observed_rainfall'],
        'result': r['result_type']
    })

hits = len([r for r in verification_results if r['result_type'] == 'Hit'])
misses = len([r for r in verification_results if r['result_type'] == 'Miss'])
false_alarms = len([r for r in verification_results if r['result_type'] == 'False Alarm'])
correct_negatives = len([r for r in verification_results if r['result_type'] == 'Correct Negative'])
total = len(verification_results)
overall_accuracy = ((hits + correct_negatives) / total * 100) if total > 0 else 0.0

output['overall'] = {
    'verifications': all_verifications,
    'statistics': {
        'hits': hits,
        'misses': misses,
        'falseAlarms': false_alarms,
        'correctNegatives': correct_negatives,
        'total': total,
        'accuracy': overall_accuracy
    }
}

# Cache the result
storage.save_verification_result('${date}', output, overall_accuracy)

print(json.dumps(output))
"`;

    const { stdout, stderr } = await execAsync(pythonCommand, {
      maxBuffer: 10 * 1024 * 1024
    });

    // Parse the JSON output from Python
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Date verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get date verification',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
