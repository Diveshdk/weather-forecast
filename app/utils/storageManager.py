"""
Persistent Storage Manager for IMD Verification System
Handles one-time upload, data caching, and metadata management
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

class StorageManager:
    """Manages persistent storage for IMD verification data"""
    
    def __init__(self, base_dir: str = "data"):
        """
        Initialize storage manager
        
        Args:
            base_dir: Base directory for all stored data
        """
        self.base_dir = Path(base_dir)
        self.forecast_dir = self.base_dir / "forecast"
        self.realised_dir = self.base_dir / "realised"
        self.verification_dir = self.base_dir / "verification"
        self.metadata_file = self.base_dir / "metadata.json"
        
        # Create directories if they don't exist
        for dir_path in [self.forecast_dir, self.realised_dir, self.verification_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def save_forecast_data(self, year: int, month: int, data: Dict, 
                          filename: str, districts: int, sheets: int) -> None:
        """
        Save forecast data for a specific month
        
        Args:
            year: Year of the forecast
            month: Month number (1-12)
            data: Forecast data dictionary
            filename: Original filename
            districts: Number of districts
            sheets: Number of sheets processed
        """
        month_key = f"{year}-{month:02d}"
        file_path = self.forecast_dir / f"{month_key}.json"
        
        # Save data
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Update metadata
        self._update_metadata('forecast', month_key, {
            'filename': filename,
            'uploadDate': datetime.now().isoformat(),
            'dateRange': {
                'start': f"{year}-{month:02d}-01",
                'end': f"{year}-{month:02d}-{self._days_in_month(year, month)}"
            },
            'districts': districts,
            'sheets': sheets
        })
    
    def save_realised_data(self, year: int, month: int, data: Dict,
                          filename: str, districts: int, stations: int) -> None:
        """
        Save realised rainfall data for a specific month
        
        Args:
            year: Year of the data
            month: Month number (1-12)
            data: Realised data dictionary
            filename: Original filename
            districts: Number of districts
            stations: Number of stations
        """
        month_key = f"{year}-{month:02d}"
        file_path = self.realised_dir / f"{month_key}.json"
        
        # Save data
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        # Update metadata
        self._update_metadata('realised', month_key, {
            'filename': filename,
            'uploadDate': datetime.now().isoformat(),
            'dateRange': {
                'start': f"{year}-{month:02d}-01",
                'end': f"{year}-{month:02d}-{self._days_in_month(year, month)}"
            },
            'districts': districts,
            'stations': stations
        })
    
    def save_verification_result(self, date: str, result: Dict, accuracy: float) -> None:
        """
        Save verification result for a specific date
        
        Args:
            date: Date in YYYY-MM-DD format
            result: Verification result dictionary
            accuracy: Overall accuracy for this date
        """
        file_path = self.verification_dir / f"{date}.json"
        
        # Save result
        with open(file_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        # Update metadata with accuracy cache
        metadata = self._load_metadata()
        if 'verificationCache' not in metadata:
            metadata['verificationCache'] = {}
        
        metadata['verificationCache'][date] = {
            'calculatedAt': datetime.now().isoformat(),
            'accuracy': accuracy
        }
        
        self._save_metadata(metadata)
    
    def load_forecast_data(self, year: int, month: int) -> Optional[Dict]:
        """Load forecast data for a specific month"""
        month_key = f"{year}-{month:02d}"
        file_path = self.forecast_dir / f"{month_key}.json"
        
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def load_realised_data(self, year: int, month: int) -> Optional[Dict]:
        """Load realised data for a specific month"""
        month_key = f"{year}-{month:02d}"
        file_path = self.realised_dir / f"{month_key}.json"
        
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def load_verification_result(self, date: str) -> Optional[Dict]:
        """Load cached verification result for a specific date"""
        file_path = self.verification_dir / f"{date}.json"
        
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def get_cached_accuracy(self, date: str) -> Optional[float]:
        """Get cached accuracy for a date"""
        metadata = self._load_metadata()
        cache = metadata.get('verificationCache', {})
        if date in cache:
            return cache[date]['accuracy']
        return None
    
    def get_available_months(self, data_type: str = 'forecast') -> List[str]:
        """
        Get list of available months for a data type
        
        Args:
            data_type: 'forecast' or 'realised'
        
        Returns:
            List of month keys (YYYY-MM)
        """
        metadata = self._load_metadata()
        uploads = metadata.get('uploads', {}).get(data_type, {})
        return list(uploads.keys())
    
    def get_available_dates(self, year: int, month: int) -> List[str]:
        """
        Get list of available dates for a specific month
        
        Args:
            year: Year
            month: Month number (1-12)
        
        Returns:
            List of dates in YYYY-MM-DD format
        """
        month_key = f"{year}-{month:02d}"
        
        # Check if we have both forecast and realised data
        forecast_data = self.load_forecast_data(year, month)
        realised_data = self.load_realised_data(year, month)
        
        if not forecast_data or not realised_data:
            return []
        
        # Get dates from realised data (these are the verification dates)
        dates = set()
        for district_data in realised_data.values():
            dates.update(district_data.keys())
        
        return sorted(list(dates))
    
    def has_data_for_month(self, year: int, month: int) -> Dict[str, bool]:
        """
        Check if data exists for a specific month
        
        Returns:
            Dict with 'forecast' and 'realised' boolean flags
        """
        month_key = f"{year}-{month:02d}"
        return {
            'forecast': (self.forecast_dir / f"{month_key}.json").exists(),
            'realised': (self.realised_dir / f"{month_key}.json").exists()
        }
    
    def get_metadata(self) -> Dict:
        """Get full metadata"""
        return self._load_metadata()
    
    def clear_all_data(self) -> None:
        """Clear all stored data (use with caution!)"""
        import shutil
        if self.base_dir.exists():
            shutil.rmtree(self.base_dir)
        self.__init__(str(self.base_dir))
    
    # Private helper methods
    
    def _load_metadata(self) -> Dict:
        """Load metadata from file"""
        if not self.metadata_file.exists():
            return {'uploads': {}, 'verificationCache': {}}
        
        with open(self.metadata_file, 'r') as f:
            return json.load(f)
    
    def _save_metadata(self, metadata: Dict) -> None:
        """Save metadata to file"""
        with open(self.metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _update_metadata(self, data_type: str, month_key: str, info: Dict) -> None:
        """Update metadata for a specific upload"""
        metadata = self._load_metadata()
        
        if 'uploads' not in metadata:
            metadata['uploads'] = {}
        if data_type not in metadata['uploads']:
            metadata['uploads'][data_type] = {}
        
        metadata['uploads'][data_type][month_key] = info
        self._save_metadata(metadata)
    
    def _days_in_month(self, year: int, month: int) -> int:
        """Get number of days in a month"""
        days_in_month = {
            1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
            7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
        }
        days = days_in_month[month]
        # Handle leap year for February
        if month == 2 and self._is_leap_year(year):
            days = 29
        return days
    
    def _is_leap_year(self, year: int) -> bool:
        """Check if a year is a leap year"""
        return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)


# Test function
if __name__ == "__main__":
    storage = StorageManager("data")
    
    print("Storage Manager Test")
    print("=" * 50)
    
    # Test metadata
    metadata = storage.get_metadata()
    print(f"Current metadata: {json.dumps(metadata, indent=2)}")
    
    # Test available months
    forecast_months = storage.get_available_months('forecast')
    print(f"\nAvailable forecast months: {forecast_months}")
    
    realised_months = storage.get_available_months('realised')
    print(f"Available realised months: {realised_months}")
