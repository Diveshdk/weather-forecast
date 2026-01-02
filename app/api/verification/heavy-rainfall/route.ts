import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * POST /api/verification/heavy-rainfall
 * Run heavy rainfall verification with user-configurable parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threshold = 64.5, startDate, endDate, year = 2025, month = 6 } = body;

    // Validate inputs
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Run Python verification engine
    const pythonCommand = `cd ${process.cwd()} && source .venv/bin/activate && python3 -c "
import sys
sys.path.append('app/utils')
from verificationEngine import VerificationEngine
import json

# Initialize engine with threshold
engine = VerificationEngine(threshold=${threshold})

# Run verification
results = engine.verify_all_lead_times(
    year=${year},
    month=${month},
    start_date='${startDate}',
    end_date='${endDate}'
)

if results['success']:
    # Calculate spatial accuracy
    all_verifications = []
    for data in results['lead_times'].values():
        all_verifications.extend(data['verifications'])
    
    spatial_results = engine.calculate_spatial_accuracy(all_verifications)
    results['spatial_accuracy'] = spatial_results
    
    # Remove detailed verifications to reduce payload size
    for lead_time in results['lead_times']:
        # Keep only scores, remove individual verifications
        results['lead_times'][lead_time] = {
            'scores': results['lead_times'][lead_time]['scores'],
            'count': len(results['lead_times'][lead_time]['verifications'])
        }

print(json.dumps(results))
"`;

    const { stdout } = await execAsync(pythonCommand, {
      maxBuffer: 10 * 1024 * 1024
    });

    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Heavy rainfall verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run verification',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
