import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * GET /api/dates?year=2025&month=6
 * Returns available dates for a specific month
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || '2025';
    const month = searchParams.get('month') || '6';
    
    // Run Python script to get available dates
    const pythonCommand = `cd ${process.cwd()} && source .venv/bin/activate && python3 -c "
import sys
sys.path.append('app/utils')
from storageManager import StorageManager
import json

storage = StorageManager('data')
dates = storage.get_available_dates(${year}, ${month})

# Get cached accuracies
metadata = storage.get_metadata()
cache = metadata.get('verificationCache', {})

dates_with_accuracy = []
for date in dates:
    accuracy = cache.get(date, {}).get('accuracy')
    dates_with_accuracy.append({
        'date': date,
        'accuracy': accuracy,
        'cached': accuracy is not None
    })

print(json.dumps({
    'success': True,
    'year': ${year},
    'month': ${month},
    'dates': dates_with_accuracy,
    'total': len(dates)
}))
"`;

    const { stdout } = await execAsync(pythonCommand, {
      maxBuffer: 10 * 1024 * 1024
    });

    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    const result = JSON.parse(jsonLine);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Dates error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get dates',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
