"""
IMD Heavy Rainfall Verification System
Module: Enhanced Data Parser for IMD Excel Files
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import re
import os

class IMDDataParser:
    """Enhanced parser for IMD rainfall and forecast data from Excel files"""
    
    def __init__(self, heavy_threshold: float = 64.5):
        """
        Initialize parser with configurable heavy rainfall threshold
        
        Args:
            heavy_threshold: Rainfall threshold in mm for heavy rainfall classification
        """
        self.heavy_threshold = heavy_threshold
        
        # Heavy rainfall warning codes (base codes only)
        self.heavy_rainfall_codes = {
            5, 6, 7, 8, 9, 10, 11, 12, 
            25, 26, 27, 28, 29, 
            33, 34, 35, 
            37, 38, 39, 
            44, 45, 
            56
        }
        
        # District name mapping between forecast and realised files
        self.district_mapping = {
            'MUMBAI': ['MUMBAI CITY', 'MUMBAI SUBURBAN'],
            'PALGHAR': ['PALGHAR'],
            'THANE': ['THANE'],
            'RAIGAD': ['RAIGAD'],
            'RATNAGIRI': ['RATNAGIRI'],
            'SINDHUDURG': ['SINDHUDURG'],
            'DHULE': ['DHULE'],
            'NANDURBAR': ['NANDURBAR'],
            'JALGAON': ['JALGAON'],
            'NASIK': ['NASIK', 'NASHIK'],
            'AHMEDNAGAR': ['AHMEDNAGAR', 'AHMADNAGAR'],
            'PUNE': ['PUNE'],
            'KOLHAPUR': ['KOLHAPUR'],
            'SATARA': ['SATARA'],
            'SANGLI': ['SANGLI'],
            'SHOLAPUR': ['SOLAPUR', 'SHOLAPUR'],
            'CHHATRAPATI SAMBHAJINAGAR': ['AURANGABAD', 'CHHATRAPATI SAMBHAJINAGAR'],
            'JALNA': ['JALNA'],
            'PARBHANI': ['PARBHANI'],
            'BEED': ['BEED'],
            'HINGOLI': ['HINGOLI'],
            'NANDED': ['NANDED'],
            'LATUR': ['LATUR'],
            'DHARASHIV': ['OSMANABAD', 'DHARASHIV'],
            'NANDURBAR': ['NANDURBAR'],
            # GHAT regions mapped to their parent districts
            'NASIK GHAT': ['NASIK', 'NASHIK'],
            'KOLHAPUR GHAT': ['KOLHAPUR'],
            'PUNE GHAT': ['PUNE'],
        }
        
        # Regional groupings to skip (not actual districts)
        self.skip_regions = {
            'NORTH KONKAN', 'SOUTH KONKAN', 
            'NORTH MADHYA MAHARASHTRA', 'SOUTH MADHYA MAHARASHTRA',
            'MARATHWADA', 'VIDARBHA'
        }
        
    def extract_base_code(self, code_value: float) -> int:
        """
        Extract base code from decimal values
        Examples: 5.1 -> 5, 27.2 -> 27, 56.3 -> 56
        """
        if pd.isna(code_value):
            return None
        return int(code_value)
    
    def is_heavy_rainfall_forecast(self, code: float) -> bool:
        """
        Determine if forecast code represents heavy rainfall
        Handles both integer codes and decimal subcategories (e.g., 5.1, 27.2, 56.3)
        
        Args:
            code: Warning code (can be integer or decimal)
            
        Returns:
            True if code indicates heavy rainfall, False otherwise
        """
        if pd.isna(code):
            return False
        
        # Extract base code (integer part)
        base_code = self.extract_base_code(code)
        
        # Check if base code is in heavy rainfall list
        return base_code in self.heavy_rainfall_codes
    
    def is_heavy_rainfall_observed(self, rainfall_mm: float) -> bool:
        """
        Determine if observed rainfall is heavy based on threshold
        
        Args:
            rainfall_mm: Observed rainfall in millimeters
            
        Returns:
            True if rainfall exceeds threshold, False otherwise
        """
        if pd.isna(rainfall_mm):
            return False
        return rainfall_mm >= self.heavy_threshold
    
    def parse_district_forecasts(self, filepath: str) -> Dict[str, Dict[str, Dict[str, Optional[float]]]]:
        """
        Parse district forecast data from XLSX files
        
        File Structure:
        - Each sheet represents one issue date (e.g., "01 Jun", "02 Jun")
        - Row 4 contains "DISTRICTS", "D1", "D2", "D3", "D4", "D5"
        - Subsequent rows contain district names and their D1-D5 codes in columns 0-5
        
        Returns:
            {district: {issue_date: {D1: code, D2: code, D3: code, D4: code, D5: code}}}
        """
        try:
            xl_file = pd.ExcelFile(filepath)
            forecast_data = {}
            
            print(f"Parsing forecast file: {filepath}")
            print(f"Found {len(xl_file.sheet_names)} sheets")
            
            for sheet_name in xl_file.sheet_names:
                # Skip non-date sheets
                if 'District Codes' in sheet_name or 'Sheet' in sheet_name:
                    continue
                
                # Extract date from sheet name (e.g., "01 Jun" -> "2025-06-01")
                try:
                    date_parts = sheet_name.split()
                    if len(date_parts) >= 2:
                        day = int(date_parts[0])
                        month_name = date_parts[1]
                        
                        month_map = {
                            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                        }
                        
                        if month_name in month_map:
                            month = month_map[month_name]
                            year = 2025
                            issue_date = f"{year:04d}-{month:02d}-{day:02d}"
                        else:
                            continue
                    else:
                        continue
                        
                except Exception as e:
                    print(f"Error parsing sheet name '{sheet_name}': {e}")
                    continue
                
                # Read the sheet
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)
                
                # Find the header row with "DISTRICTS", "D1", "D2", etc.
                header_row_idx = None
                for idx, row in df.iterrows():
                    if pd.notna(row.iloc[0]) and 'DISTRICTS' in str(row.iloc[0]).upper():
                        header_row_idx = idx
                        break
                
                if header_row_idx is None:
                    print(f"Warning: Could not find header row in sheet '{sheet_name}'")
                    continue
                
                # Parse district rows (start after header row)
                for idx in range(header_row_idx + 1, len(df)):
                    row = df.iloc[idx]
                    
                    # Get district name from column 0
                    if pd.isna(row.iloc[0]):
                        continue
                    
                    district_name = str(row.iloc[0]).strip()
                    
                    # Skip regional groupings
                    if district_name.upper() in self.skip_regions:
                        continue
                    
                    # Skip rows that look like headers or separators
                    if any(x in district_name.upper() for x in 
                          ['DISTRICT FORECAST', 'DATE:', 'TIME', 'SCROLL', 'KONKAN', 'MADHYA', 'MARATHWADA', 'VIDARBHA']):
                        continue
                    
                    # Skip "Ghats of" districts for now (can be enabled later if needed)
                    if 'Ghats of' in district_name:
                        continue
                    
                    # Extract D1-D5 codes from columns 1-5
                    try:
                        d1 = float(row.iloc[1]) if pd.notna(row.iloc[1]) and str(row.iloc[1]).replace('.', '').isdigit() else None
                        d2 = float(row.iloc[2]) if pd.notna(row.iloc[2]) and str(row.iloc[2]).replace('.', '').isdigit() else None
                        d3 = float(row.iloc[3]) if pd.notna(row.iloc[3]) and str(row.iloc[3]).replace('.', '').isdigit() else None
                        d4 = float(row.iloc[4]) if pd.notna(row.iloc[4]) and str(row.iloc[4]).replace('.', '').isdigit() else None
                        d5 = float(row.iloc[5]) if pd.notna(row.iloc[5]) and str(row.iloc[5]).replace('.', '').isdigit() else None
                        
                        # Only add if at least one code is present
                        if any(x is not None for x in [d1, d2, d3, d4, d5]):
                            # Normalize district name
                            district_key = district_name.upper().strip()
                            
                            if district_key not in forecast_data:
                                forecast_data[district_key] = {}
                            
                            forecast_data[district_key][issue_date] = {
                                'D1': d1,
                                'D2': d2,
                                'D3': d3,
                                'D4': d4,
                                'D5': d5
                            }
                    except Exception as e:
                        # Skip rows that can't be parsed
                        continue
            
            print(f"Successfully parsed {len(forecast_data)} districts")
            return forecast_data
            
        except Exception as e:
            print(f"Error parsing district forecasts from {filepath}: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def parse_observed_rainfall(self, filepath: str, target_month: str = "JUNE") -> Dict[str, Dict[str, float]]:
        """
        Parse observed rainfall data from XLS files
        
        File Structure:
        - Row 10 contains header: "MET.SUB/DISTRICT/STATION", 1, 2, 3, ..., 30
        - Districts are marked by "DISTRICT: DISTRICT_NAME"
        - Station rows contain rainfall values in columns 1-30 (for days 1-30)
        
        Returns:
            {district: {date: rainfall_mm}}
        """
        try:
            df = pd.read_excel(filepath, sheet_name=0, header=None)
            
            print(f"Parsing realised rainfall file: {filepath}")
            print(f"File shape: {df.shape}")
            
            observed_data = {}
            current_district = None
            
            # Determine year and month
            year = 2025
            month = 6 if 'JUNE' in target_month.upper() else 5
            days_in_month = 30 if month == 6 else 31
            
            for idx, row in df.iterrows():
                # Check for district header
                if pd.notna(row.iloc[0]):
                    row_str = str(row.iloc[0]).strip()
                    
                    if 'DISTRICT:' in row_str.upper():
                        # Extract district name
                        district_name = row_str.split(':', 1)[1].strip().upper()
                        current_district = district_name
                        
                        # Initialize district in data structure
                        if current_district not in observed_data:
                            observed_data[current_district] = {}
                        
                        continue
                
                # If we have a current district, try to extract rainfall data
                if current_district:
                    # Skip header rows and empty rows
                    if pd.isna(row.iloc[0]):
                        continue
                    
                    row_str = str(row.iloc[0]).strip()
                    
                    # Skip separator rows and headers
                    if any(x in row_str.upper() for x in ['---', 'MET.SUB', 'STATION', 'DISTRICT:', 'SUBDIVISION']):
                        continue
                    
                    # This should be a station row with rainfall data
                    # Extract daily rainfall values from columns 1-30
                    station_name = row_str
                    
                    for day_num in range(1, days_in_month + 1):
                        if day_num < len(row):
                            val = row.iloc[day_num]
                            
                            if pd.notna(val):
                                try:
                                    rainfall = float(val)
                                    date_str = f"{year:04d}-{month:02d}-{day_num:02d}"
                                    
                                    # Aggregate by district (take maximum rainfall from all stations)
                                    if date_str not in observed_data[current_district]:
                                        observed_data[current_district][date_str] = rainfall
                                    else:
                                        observed_data[current_district][date_str] = max(
                                            observed_data[current_district][date_str], rainfall
                                        )
                                except (ValueError, TypeError):
                                    # Skip non-numeric values
                                    continue
            
            print(f"Successfully parsed {len(observed_data)} districts")
            return observed_data
            
        except Exception as e:
            print(f"Error parsing observed rainfall from {filepath}: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def get_forecast_for_verification(self, forecast_data: Dict, district: str, 
                                     verification_date: str, lead_days: int) -> Optional[float]:
        """
        Get forecast code for a specific verification date and lead time
        
        Lead time logic:
        - Day-1: Forecast issued ON the verification date (D1 column)
        - Day-2: Forecast issued 1 day BEFORE verification date (D2 column)
        - Day-3: Forecast issued 2 days BEFORE verification date (D3 column)
        - Day-4: Forecast issued 3 days BEFORE verification date (D4 column)
        - Day-5: Forecast issued 4 days BEFORE verification date (D5 column)
        
        Args:
            forecast_data: Parsed forecast data
            district: District name
            verification_date: Date to verify (YYYY-MM-DD)
            lead_days: Lead time (1-5)
        
        Returns:
            Forecast code or None if not available
        """
        try:
            verification_dt = datetime.strptime(verification_date, '%Y-%m-%d')
            
            # Calculate issue date based on lead time
            # Day-1: issued on verification_date (0 days before)
            # Day-2: issued 1 day before
            # Day-3: issued 2 days before, etc.
            days_before = lead_days - 1
            issue_dt = verification_dt - timedelta(days=days_before)
            issue_date = issue_dt.strftime('%Y-%m-%d')
            
            # Normalize district name
            district_upper = district.upper().strip()
            
            # Check if district and issue date exist in forecast data
            if district_upper in forecast_data and issue_date in forecast_data[district_upper]:
                forecast_codes = forecast_data[district_upper][issue_date]
                day_key = f'D{lead_days}'
                return forecast_codes.get(day_key)
            
            return None
            
        except Exception as e:
            print(f"Error getting forecast for {district} on {verification_date} (lead={lead_days}): {e}")
            return None
    
    def map_district_name(self, forecast_district: str, observed_districts: List[str]) -> Optional[str]:
        """
        Map forecast district name to observed district name(s)
        
        Args:
            forecast_district: District name from forecast file
            observed_districts: List of available district names in observed data
            
        Returns:
            Matched district name or None
        """
        forecast_upper = forecast_district.upper().strip()
        
        # Direct match
        if forecast_upper in observed_districts:
            return forecast_upper
        
        # Check mapping
        if forecast_upper in self.district_mapping:
            mapped_names = self.district_mapping[forecast_upper]
            for mapped in mapped_names:
                if mapped.upper() in observed_districts:
                    return mapped.upper()
        
        # Fuzzy match (contains)
        for obs_district in observed_districts:
            if forecast_upper in obs_district or obs_district in forecast_upper:
                return obs_district
        
        return None


def load_imd_data(files_dir: str, heavy_threshold: float = 64.5) -> Tuple[Dict, Dict, Dict, Dict]:
    """
    Load all IMD data files
    
    Args:
        files_dir: Directory containing IMD data files
        heavy_threshold: Heavy rainfall threshold in mm
    
    Returns:
        (june_observed, may_observed, june_forecasts, may_forecasts)
    """
    parser = IMDDataParser(heavy_threshold=heavy_threshold)
    
    june_observed = {}
    may_observed = {}
    june_forecasts = {}
    may_forecasts = {}
    
    try:
        # Load observed rainfall data
        june_file = os.path.join(files_dir, "JUNE 2025.xls")
        if os.path.exists(june_file):
            print(f"\n=== Loading June Observed Data ===")
            june_observed = parser.parse_observed_rainfall(june_file, "JUNE")
        else:
            print(f"Warning: June observed file not found: {june_file}")
        
        may_file = os.path.join(files_dir, "MAY 2025.xls")
        if os.path.exists(may_file):
            print(f"\n=== Loading May Observed Data ===")
            may_observed = parser.parse_observed_rainfall(may_file, "MAY")
        else:
            print(f"Warning: May observed file not found: {may_file}")
        
        # Load forecast data
        june_forecast_file = os.path.join(files_dir, "District Forecast June 2025.xlsx")
        if os.path.exists(june_forecast_file):
            print(f"\n=== Loading June Forecast Data ===")
            june_forecasts = parser.parse_district_forecasts(june_forecast_file)
        else:
            print(f"Warning: June forecast file not found: {june_forecast_file}")
        
        may_forecast_file = os.path.join(files_dir, "District Forecast May 2025.xlsx")
        if os.path.exists(may_forecast_file):
            print(f"\n=== Loading May Forecast Data ===")
            may_forecasts = parser.parse_district_forecasts(may_forecast_file)
        else:
            print(f"Warning: May forecast file not found: {may_forecast_file}")
    
    except Exception as e:
        print(f"Error loading IMD data: {e}")
        import traceback
        traceback.print_exc()
    
    return june_observed, may_observed, june_forecasts, may_forecasts


if __name__ == "__main__":
    # Test the parser
    files_dir = "/Users/divesh/Desktop/imd/imdfiles"
    
    print("=" * 80)
    print("Testing Enhanced IMD Data Parser")
    print("=" * 80)
    
    june_obs, may_obs, june_fc, may_fc = load_imd_data(files_dir)
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"June observed districts: {len(june_obs)}")
    print(f"  Districts: {list(june_obs.keys())[:5]}...")
    
    print(f"\nJune forecast districts: {len(june_fc)}")
    print(f"  Districts: {list(june_fc.keys())[:5]}...")
    
    if june_obs and june_fc:
        # Test forecast retrieval
        sample_district = list(june_fc.keys())[0]
        print(f"\n=== Testing Forecast Retrieval for {sample_district} ===")
        
        parser = IMDDataParser()
        verification_date = "2025-06-05"
        
        for lead in range(1, 6):
            code = parser.get_forecast_for_verification(june_fc, sample_district, verification_date, lead)
            is_heavy = parser.is_heavy_rainfall_forecast(code) if code else False
            print(f"Day-{lead}: Code={code}, Heavy={is_heavy}")
        
        # Test observed rainfall
        if sample_district in june_obs:
            if verification_date in june_obs[sample_district]:
                rainfall = june_obs[sample_district][verification_date]
                is_heavy = parser.is_heavy_rainfall_observed(rainfall)
                print(f"\nObserved on {verification_date}: {rainfall}mm, Heavy={is_heavy}")
