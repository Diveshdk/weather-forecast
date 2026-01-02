"""
One-Time Data Upload Script
Processes IMD files and stores them permanently
"""

import sys
import os
from pathlib import Path

# Add app directory to path
sys.path.append(str(Path(__file__).parent))

from imdDataParser import IMDDataParser, load_imd_data
from storageManager import StorageManager
import json

def upload_imd_data(files_dir: str, threshold: float = 64.5):
    """
    Perform one-time upload of IMD data
    
    Args:
        files_dir: Directory containing IMD Excel files
        threshold: Heavy rainfall threshold in mm
    """
    print("\n" + "="*80)
    print("IMD DATA ONE-TIME UPLOAD")
    print("="*80)
    
    # Initialize storage and parser
    storage = StorageManager("data")
    parser = IMDDataParser(heavy_threshold=threshold)
    
    # Load all data
    print("\nLoading data from files...")
    june_obs, may_obs, june_fc, may_fc = load_imd_data(files_dir, threshold)
    
    # Save June 2025 data
    if june_fc:
        print("\n📁 Saving June 2025 Forecast Data...")
        storage.save_forecast_data(
            year=2025,
            month=6,
            data=june_fc,
            filename="District Forecast June 2025.xlsx",
            districts=len(june_fc),
            sheets=31  # June has 31 sheets (1-30 + extras)
        )
        print(f"   ✓ Saved {len(june_fc)} districts")
    
    if june_obs:
        print("\n📁 Saving June 2025 Realised Data...")
        # Count stations
        total_stations = sum(len(set([k.split('_')[0] for k in district_data.keys()])) 
                           for district_data in june_obs.values())
        storage.save_realised_data(
            year=2025,
            month=6,
            data=june_obs,
            filename="JUNE 2025.xls",
            districts=len(june_obs),
            stations=total_stations
        )
        print(f"   ✓ Saved {len(june_obs)} districts")
    
    # Save May 2025 data
    if may_fc:
        print("\n📁 Saving May 2025 Forecast Data...")
        storage.save_forecast_data(
            year=2025,
            month=5,
            data=may_fc,
            filename="District Forecast May 2025.xlsx",
            districts=len(may_fc),
            sheets=33  # May sheets
        )
        print(f"   ✓ Saved {len(may_fc)} districts")
    
    if may_obs:
        print("\n📁 Saving May 2025 Realised Data...")
        total_stations = sum(len(set([k.split('_')[0] for k in district_data.keys()])) 
                           for district_data in may_obs.values())
        storage.save_realised_data(
            year=2025,
            month=5,
            data=may_obs,
            filename="MAY 2025.xls",
            districts=len(may_obs),
            stations=total_stations
        )
        print(f"   ✓ Saved {len(may_obs)} districts")
    
    # Display summary
    print("\n" + "="*80)
    print("UPLOAD SUMMARY")
    print("="*80)
    
    metadata = storage.get_metadata()
    
    if 'uploads' in metadata:
        if 'forecast' in metadata['uploads']:
            print("\n📊 Forecast Data:")
            for month_key, info in metadata['uploads']['forecast'].items():
                print(f"   {month_key}: {info['districts']} districts, {info['sheets']} sheets")
                print(f"            {info['filename']}")
        
        if 'realised' in metadata['uploads']:
            print("\n📊 Realised Data:")
            for month_key, info in metadata['uploads']['realised'].items():
                print(f"   {month_key}: {info['districts']} districts, {info['stations']} stations")
                print(f"            {info['filename']}")
    
    # Show available dates
    print("\n📅 Available Dates:")
    june_dates = storage.get_available_dates(2025, 6)
    if june_dates:
        print(f"   June 2025: {len(june_dates)} dates ({june_dates[0]} to {june_dates[-1]})")
    
    may_dates = storage.get_available_dates(2025, 5)
    if may_dates:
        print(f"   May 2025: {len(may_dates)} dates ({may_dates[0]} to {may_dates[-1]})")
    
    print("\n" + "="*80)
    print("✅ UPLOAD COMPLETE - Data stored permanently!")
    print("   You will never need to upload these files again.")
    print("="*80 + "\n")
    
    return storage.get_metadata()


if __name__ == "__main__":
    # Default files directory
    files_dir = "imdfiles"
    
    # Check if directory exists
    if not os.path.exists(files_dir):
        print(f"Error: Directory '{files_dir}' not found!")
        sys.exit(1)
    
    # Perform upload
    metadata = upload_imd_data(files_dir)
    
    # Print metadata
    print("\n📋 Metadata saved to data/metadata.json")
    print(json.dumps(metadata, indent=2))
