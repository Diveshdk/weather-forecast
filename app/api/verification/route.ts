import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threshold = 64.5 } = body;

    // Path to Python script
    const pythonScript = path.join(process.cwd(), 'app', 'utils', 'heavyRainfallVerifier.py');
    const filesDir = path.join(process.cwd(), 'imdfiles');
    
    // Check if files exist
    const forecastFile = path.join(filesDir, 'District Forecast June 2025.xlsx');
    const realisedFile = path.join(filesDir, 'JUNE 2025.xls');
    
    try {
      await fs.access(forecastFile);
      await fs.access(realisedFile);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Required data files not found. Please ensure forecast and realised files are in the imdfiles directory.' 
        },
        { status: 400 }
      );
    }

    // Run Python verification script
    const pythonCommand = `cd ${process.cwd()} && source .venv/bin/activate && python3 -c "
import sys
sys.path.append('app/utils')
from heavyRainfallVerifier import HeavyRainfallVerifier
import json

verifier = HeavyRainfallVerifier(heavy_threshold=${threshold})
results = verifier.run_full_verification('${filesDir}', 'June')

# Convert results to JSON-serializable format
output = {
    'success': True,
    'total_verifications': results['total_verifications'],
    'districts_analyzed': results['districts_analyzed'],
    'dates_analyzed': results['dates_analyzed'],
    'heavy_threshold': results['heavy_threshold'],
    'skill_scores': {}
}

# Convert skill scores
for lead, scores in results['skill_scores'].items():
    output['skill_scores'][lead] = {
        'lead_days': scores.lead_days,
        'hits': scores.hits,
        'misses': scores.misses,
        'false_alarms': scores.false_alarms,
        'correct_negatives': scores.correct_negatives,
        'total': scores.total,
        'accuracy': scores.accuracy,
        'pod': scores.pod,
        'far': scores.far,
        'csi': scores.csi,
        'bias': scores.bias
    }

print(json.dumps(output))
"`;

    const { stdout, stderr } = await execAsync(pythonCommand, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes('Successfully parsed')) {
      console.error('Python stderr:', stderr);
    }

    // Parse the JSON output from Python
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1]; // Last line should be JSON
    const results = JSON.parse(jsonLine);

    // Store results in a temporary file for later retrieval
    const resultsPath = path.join(process.cwd(), 'data', 'verification_results.json');
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    
    // We'll need to store the full verification results for date-specific queries
    // For now, just store the summary
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Verification completed successfully',
      summary: {
        totalVerifications: results.total_verifications,
        districtsAnalyzed: results.districts_analyzed.length,
        datesAnalyzed: results.dates_analyzed.length,
        threshold: results.heavy_threshold
      },
      skillScores: results.skill_scores,
      availableDates: results.dates_analyzed
    });

  } catch (error: any) {
    console.error('Verification error:', error);
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
