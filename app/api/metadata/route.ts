import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * GET /api/metadata
 * Returns metadata about available data
 */
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const metadataFile = path.join(dataDir, 'metadata.json');
    
    // Check if metadata exists
    try {
      await fs.access(metadataFile);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'No data uploaded yet. Please upload IMD files first.',
        hasData: false
      });
    }
    
    // Read metadata
    const metadataContent = await fs.readFile(metadataFile, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Extract available months
    const availableMonths = {
      forecast: Object.keys(metadata.uploads?.forecast || {}),
      realised: Object.keys(metadata.uploads?.realised || {})
    };
    
    // Get verification cache info
    const cachedDates = Object.keys(metadata.verificationCache || {});
    
    return NextResponse.json({
      success: true,
      hasData: true,
      metadata,
      availableMonths,
      cachedVerifications: cachedDates.length,
      summary: {
        forecastMonths: availableMonths.forecast.length,
        realisedMonths: availableMonths.realised.length,
        cachedDates: cachedDates.length
      }
    });
    
  } catch (error: any) {
    console.error('Metadata error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get metadata',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
