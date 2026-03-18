/**
 * Rainfall Classification Utilities
 * Based on IMD thresholds for Maharashtra and Goa
 */

export interface RainfallCategory {
  name: string;
  color: string;
  min: number;
  max: number | null;
}

export const RAINFALL_CATEGORIES: RainfallCategory[] = [
  { name: 'No Rainfall', color: '#D3D3D3', min: 0, max: 0 },
  { name: 'Moderate', color: '#FFFFE0', min: 0.1, max: 64.4 },
  { name: 'Heavy', color: '#FFA500', min: 64.5, max: 115.5 },
  { name: 'Very Heavy', color: '#FF0000', min: 115.6, max: 204.4 },
  { name: 'Extremely Heavy', color: '#8B0000', min: 204.5, max: null },
];

/**
 * Get color based on rainfall value
 */
export function getRainfallColor(value: number): string {
  if (value === 0) return '#D3D3D3'; // No Rainfall
  if (value < 64.5) return '#FFFFE0'; // Moderate
  if (value <= 115.5) return '#FFA500'; // Heavy
  if (value <= 204.4) return '#FF0000'; // Very Heavy
  return '#8B0000'; // Extremely Heavy
}

/**
 * Get category name based on rainfall value
 */
export function getRainfallCategory(value: number): string {
  if (value === 0) return 'No Rainfall';
  if (value < 64.5) return 'Moderate Rainfall';
  if (value <= 115.5) return 'Heavy Rainfall';
  if (value <= 204.4) return 'Very Heavy Rainfall';
  return 'Extremely Heavy Rainfall';
}

/**
 * District name mapping for administrative changes
 */
export const DISTRICT_NAME_MAPPING: Record<string, string> = {
  'AHILYANAGAR': 'AHMADNAGAR',
  'CHHATRAPATI SAMBHAJI NAGAR': 'AURANGABAD',
  'CHATRAPATI SAMBHAJI NAGAR': 'AURANGABAD',
  'DHARASHIV': 'OSMANABAD',
  'RAIGAD': 'RAIGARH',
  'SHOLAPUR': 'SOLAPUR',
  'BEED': 'BID',
};

/**
 * Normalize district name for matching
 */
export function normalizeDistrictName(name: string): string {
  const normalized = name.trim().toUpperCase();
  return DISTRICT_NAME_MAPPING[normalized] || normalized;
}

/**
 * Find district column in GeoJSON properties
 */
export function findDistrictColumn(properties: any): string | null {
  const potentialCols = ['dtname', 'district', 'DISTRICT', 'NAME_2', 'Dist_Name', 'Name'];
  
  for (const col of potentialCols) {
    if (properties[col]) {
      return col;
    }
  }
  
  return null;
}
