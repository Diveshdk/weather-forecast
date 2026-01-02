"""
Heavy Rainfall Verification Engine
Implements proper meteorological verification methodology with contingency tables and skill scores
"""

import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from storageManager import StorageManager
from imdDataParser import IMDDataParser


class VerificationEngine:
    """
    Professional meteorological verification engine for heavy rainfall forecasts
    """
    
    def __init__(self, threshold: float = 64.5):
        """
        Initialize verification engine
        
        Args:
            threshold: Heavy rainfall threshold in mm (default 64.5mm)
        """
        self.threshold = threshold
        self.parser = IMDDataParser(heavy_threshold=threshold)
        self.storage = StorageManager("data")
    
    def classify_event(self, rainfall: float) -> bool:
        """
        Classify if rainfall constitutes a heavy event
        
        Args:
            rainfall: Rainfall amount in mm
            
        Returns:
            True if heavy rainfall event, False otherwise
        """
        return rainfall >= self.threshold
    
    def classify_forecast(self, forecast_code: float) -> bool:
        """
        Classify if forecast predicts heavy rainfall
        
        Args:
            forecast_code: IMD warning code
            
        Returns:
            True if heavy rainfall forecasted, False otherwise
        """
        return self.parser.is_heavy_rainfall_forecast(forecast_code)
    
    def verify_single(self, forecast_heavy: bool, observed_rainfall: float) -> Tuple[str, bool]:
        """
        Perform single verification using contingency table methodology
        
        Args:
            forecast_heavy: Whether forecast predicted heavy rainfall
            observed_rainfall: Actual observed rainfall in mm
            
        Returns:
            Tuple of (category, observed_heavy)
            Categories: 'Hit', 'Miss', 'False Alarm', 'Correct Negative'
        """
        observed_heavy = self.classify_event(observed_rainfall)
        
        if forecast_heavy and observed_heavy:
            return 'Hit', observed_heavy
        elif not forecast_heavy and observed_heavy:
            return 'Miss', observed_heavy
        elif forecast_heavy and not observed_heavy:
            return 'False Alarm', observed_heavy
        else:
            return 'Correct Negative', observed_heavy
    
    def calculate_contingency(self, verifications: List[Dict]) -> Tuple[int, int, int, int]:
        """
        Calculate contingency table counts from verification results
        
        Args:
            verifications: List of verification dictionaries
            
        Returns:
            Tuple of (H, M, F, CN) counts
        """
        H = sum(1 for v in verifications if v['category'] == 'Hit')
        M = sum(1 for v in verifications if v['category'] == 'Miss')
        F = sum(1 for v in verifications if v['category'] == 'False Alarm')
        CN = sum(1 for v in verifications if v['category'] == 'Correct Negative')
        return H, M, F, CN
    
    def calculate_skill_scores(self, H: int, M: int, F: int, CN: int) -> Dict:
        """
        Calculate meteorological skill scores from contingency table
        
        Args:
            H: Hits
            M: Misses
            F: False Alarms
            CN: Correct Negatives
            
        Returns:
            Dictionary with POD, FAR, CSI, Bias, and counts
        """
        # Probability of Detection (Hit Rate)
        POD = H / (H + M) if (H + M) > 0 else 0.0
        
        # False Alarm Ratio
        FAR = F / (H + F) if (H + F) > 0 else 0.0
        
        # Critical Success Index (Threat Score)
        CSI = H / (H + M + F) if (H + M + F) > 0 else 0.0
        
        # Bias Score (Frequency Bias)
        Bias = (H + F) / (H + M) if (H + M) > 0 else 0.0
        
        # Accuracy
        Accuracy = (H + CN) / (H + M + F + CN) if (H + M + F + CN) > 0 else 0.0
        
        return {
            'POD': round(POD, 3),
            'FAR': round(FAR, 3),
            'CSI': round(CSI, 3),
            'Bias': round(Bias, 3),
            'Accuracy': round(Accuracy, 3),
            'H': H,
            'M': M,
            'F': F,
            'CN': CN,
            'Total': H + M + F + CN
        }
    
    def verify_lead_time(self, forecast_data: Dict, realised_data: Dict, 
                        start_date: str, end_date: str, lead_days: int) -> List[Dict]:
        """
        Verify forecasts for a specific lead time over a date range
        
        Args:
            forecast_data: Forecast data dictionary
            realised_data: Realised rainfall data dictionary
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            lead_days: Lead time (1-5)
            
        Returns:
            List of verification results
        """
        verifications = []
        
        # Parse dates
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        # Get all forecast districts
        forecast_districts = set(forecast_data.keys())
        
        # Iterate through date range
        current_date = start
        while current_date <= end:
            verification_date = current_date.strftime('%Y-%m-%d')
            
            for district in forecast_districts:
                # Find matching observed district
                observed_district = self.parser.map_district_name(district, list(realised_data.keys()))
                
                if not observed_district:
                    continue
                
                # Get observed rainfall for this date
                if verification_date not in realised_data[observed_district]:
                    continue
                
                observed_rainfall = realised_data[observed_district][verification_date]
                
                # Get forecast for this lead time
                forecast_code = self.parser.get_forecast_for_verification(
                    forecast_data, district, verification_date, lead_days
                )
                
                if forecast_code is None:
                    continue
                
                # Classify forecast
                forecast_heavy = self.classify_forecast(forecast_code)
                
                # Perform verification
                category, observed_heavy = self.verify_single(forecast_heavy, observed_rainfall)
                
                verifications.append({
                    'district': district,
                    'date': verification_date,
                    'lead_days': lead_days,
                    'forecast_code': forecast_code,
                    'forecast_heavy': forecast_heavy,
                    'observed_rainfall': observed_rainfall,
                    'observed_heavy': observed_heavy,
                    'category': category
                })
            
            current_date += timedelta(days=1)
        
        return verifications
    
    def verify_all_lead_times(self, year: int, month: int, 
                             start_date: str, end_date: str) -> Dict:
        """
        Verify all lead times (Day-1 to Day-5) for a given month and date range
        
        Args:
            year: Year
            month: Month (1-12)
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary with lead-time wise results and skill scores
        """
        # Load data from storage
        forecast_data = self.storage.load_forecast_data(year, month)
        realised_data = self.storage.load_realised_data(year, month)
        
        if not forecast_data or not realised_data:
            return {
                'success': False,
                'error': 'No data available for this month'
            }
        
        results = {
            'success': True,
            'threshold': self.threshold,
            'start_date': start_date,
            'end_date': end_date,
            'lead_times': {}
        }
        
        # Verify each lead time
        for lead_days in range(1, 6):
            verifications = self.verify_lead_time(
                forecast_data, realised_data, start_date, end_date, lead_days
            )
            
            # Calculate contingency counts
            H, M, F, CN = self.calculate_contingency(verifications)
            
            # Calculate skill scores
            scores = self.calculate_skill_scores(H, M, F, CN)
            
            results['lead_times'][f'Day-{lead_days}'] = {
                'verifications': verifications,
                'scores': scores
            }
        
        return results
    
    def calculate_spatial_accuracy(self, all_verifications: List[Dict]) -> Dict:
        """
        Calculate district-wise spatial accuracy summary
        
        Args:
            all_verifications: All verification results across all lead times
            
        Returns:
            Dictionary with district-wise accuracy
        """
        district_stats = {}
        
        for v in all_verifications:
            district = v['district']
            
            if district not in district_stats:
                district_stats[district] = {
                    'H': 0,
                    'M': 0,
                    'F': 0,
                    'CN': 0
                }
            
            # Count by category
            if v['category'] == 'Hit':
                district_stats[district]['H'] += 1
            elif v['category'] == 'Miss':
                district_stats[district]['M'] += 1
            elif v['category'] == 'False Alarm':
                district_stats[district]['F'] += 1
            else:
                district_stats[district]['CN'] += 1
        
        # Calculate scores for each district
        spatial_results = {}
        for district, counts in district_stats.items():
            scores = self.calculate_skill_scores(
                counts['H'], counts['M'], counts['F'], counts['CN']
            )
            spatial_results[district] = scores
        
        return spatial_results


# Test function
if __name__ == "__main__":
    print("\n" + "="*80)
    print("HEAVY RAINFALL VERIFICATION ENGINE TEST")
    print("="*80)
    
    # Initialize engine
    engine = VerificationEngine(threshold=64.5)
    
    # Test with June 2025 data
    results = engine.verify_all_lead_times(
        year=2025,
        month=6,
        start_date='2025-06-01',
        end_date='2025-06-30'
    )
    
    if results['success']:
        print(f"\n✅ Verification completed successfully")
        print(f"Threshold: {results['threshold']}mm")
        print(f"Date Range: {results['start_date']} to {results['end_date']}")
        
        print("\n" + "="*80)
        print("LEAD-TIME VERIFICATION RESULTS")
        print("="*80)
        
        # Print lead-time table
        print(f"\n{'Lead Time':<12} {'H':<6} {'M':<6} {'F':<6} {'CN':<6} {'Total':<8} {'POD':<8} {'FAR':<8} {'CSI':<8} {'Bias':<8}")
        print("-" * 80)
        
        for lead_time, data in results['lead_times'].items():
            scores = data['scores']
            print(f"{lead_time:<12} {scores['H']:<6} {scores['M']:<6} {scores['F']:<6} {scores['CN']:<6} "
                  f"{scores['Total']:<8} {scores['POD']:<8.3f} {scores['FAR']:<8.3f} {scores['CSI']:<8.3f} {scores['Bias']:<8.3f}")
        
        # Calculate spatial accuracy
        all_verifications = []
        for data in results['lead_times'].values():
            all_verifications.extend(data['verifications'])
        
        spatial_results = engine.calculate_spatial_accuracy(all_verifications)
        
        print("\n" + "="*80)
        print("DISTRICT-WISE SPATIAL ACCURACY")
        print("="*80)
        
        print(f"\n{'District':<25} {'Correct':<10} {'Total':<10} {'Accuracy':<12} {'CSI':<8}")
        print("-" * 80)
        
        # Sort by accuracy
        sorted_districts = sorted(spatial_results.items(), 
                                 key=lambda x: x[1]['Accuracy'], reverse=True)
        
        for district, scores in sorted_districts[:15]:  # Top 15 districts
            correct = scores['H'] + scores['CN']
            print(f"{district:<25} {correct:<10} {scores['Total']:<10} "
                  f"{scores['Accuracy']*100:<11.1f}% {scores['CSI']:<8.3f}")
        
        print("\n" + "="*80)
        print("✅ VERIFICATION ENGINE TEST COMPLETE")
        print("="*80 + "\n")
    else:
        print(f"\n❌ Error: {results['error']}")
