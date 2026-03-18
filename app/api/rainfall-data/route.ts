import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeDistrictName } from '@/app/utils/rainfallColors';

interface DailyDataFile {
  date: string;
  districts: {
    [district: string]: number | null;
  };
}

interface DistrictRainfall {
  district: string;
  rainfall: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view'); // 'daily' or 'monthly'
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!view || (view !== 'daily' && view !== 'monthly')) {
      return NextResponse.json(
        { error: 'Invalid view parameter. Must be "daily" or "monthly"' },
        { status: 400 }
      );
    }

    if (view === 'daily' && !date) {
      return NextResponse.json(
        { error: 'Date parameter required for daily view' },
        { status: 400 }
      );
    }

    if (view === 'monthly' && !month) {
      return NextResponse.json(
        { error: 'Month parameter required for monthly view' },
        { status: 400 }
      );
    }

    let result: DistrictRainfall[] = [];

    if (view === 'daily') {
      result = await getDailyRainfall(date!);
    } else {
      result = await getMonthlyRainfall(month!);
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Rainfall data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rainfall data', details: error.message },
      { status: 500 }
    );
  }
}

async function getDailyRainfall(dateStr: string): Promise<DistrictRainfall[]> {
  const [year, month, day] = dateStr.split('-');
  
  // Construct file path: data/realised/YYYY/MM/DD.json
  const filePath = path.join(
    process.cwd(),
    'data',
    'realised',
    year,
    month,
    `${day}.json`
  );

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data: DailyDataFile = JSON.parse(content);

    const result: DistrictRainfall[] = [];

    // Process districts
    for (const [district, rainfall] of Object.entries(data.districts)) {
      if (rainfall !== null && !isNaN(rainfall)) {
        const normalizedDistrict = normalizeDistrictName(district);
        result.push({
          district: normalizedDistrict,
          rainfall: parseFloat(rainfall.toFixed(1))
        });

        // Handle Mumbai special case
        if (normalizedDistrict === 'MUMBAI') {
          result.push({
            district: 'MUMBAI SUBURBAN',
            rainfall: parseFloat(rainfall.toFixed(1))
          });
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

async function getMonthlyRainfall(monthStr: string): Promise<DistrictRainfall[]> {
  const [year, month] = monthStr.split('-');

  // Construct directory path: data/realised/YYYY/MM/
  const monthDir = path.join(
    process.cwd(),
    'data',
    'realised',
    year,
    month
  );

  if (!fs.existsSync(monthDir)) {
    console.log(`Directory not found: ${monthDir}`);
    return [];
  }

  try {
    const files = fs.readdirSync(monthDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return [];
    }

    // Map to store max rainfall per district
    const districtMaxRainfall = new Map<string, number>();

    // Read all daily files for the month
    for (const file of jsonFiles) {
      const filePath = path.join(monthDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: DailyDataFile = JSON.parse(content);

        // Update max rainfall for each district
        for (const [district, rainfall] of Object.entries(data.districts)) {
          if (rainfall !== null && !isNaN(rainfall)) {
            const normalizedDistrict = normalizeDistrictName(district);
            const currentMax = districtMaxRainfall.get(normalizedDistrict) || 0;
            districtMaxRainfall.set(normalizedDistrict, Math.max(currentMax, rainfall));
          }
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        continue;
      }
    }

    // Convert to result array
    const result: DistrictRainfall[] = [];
    for (const [district, maxRainfall] of districtMaxRainfall.entries()) {
      result.push({
        district,
        rainfall: parseFloat(maxRainfall.toFixed(1))
      });

      // Handle Mumbai special case
      if (district === 'MUMBAI') {
        result.push({
          district: 'MUMBAI SUBURBAN',
          rainfall: parseFloat(maxRainfall.toFixed(1))
        });
      }
    }

    return result;
  } catch (error: any) {
    console.error(`Error reading directory ${monthDir}:`, error);
    return [];
  }
}
