"""
IMD Heavy Rainfall Verification System
Module: Enhanced Verification Engine with Date-Specific Analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, NamedTuple
from dataclasses import dataclass
import os
import sys
import json

# Add the app directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(current_dir)
sys.path.append(app_dir)

from utils.imdDataParser import IMDDataParser, load_imd_data

@dataclass
class VerificationResult:
    """Single verification result for a district-date-lead combination"""
    district: str
    date: str  # Verification date
    lead_days: int  # 1=Day-1, 2=Day-2, etc.
    forecast_code: Optional[float]
    forecast_heavy: bool
    observed_rainfall: float
    observed_heavy: bool
    result_type: str  # 'Hit', 'Miss', 'False Alarm', 'Correct Negative'
    result_description: str

@dataclass
class DistrictVerification:
    """Verification for a single district on a specific date and lead time"""
    district: str
    forecast_heavy: bool
    forecast_rainfall: Optional[float]  # Warning code
    observed_heavy: bool
    observed_rainfall: float  # Actual rainfall in mm
    result: str  # 'Hit', 'Miss', 'False Alarm', 'Correct Negative'

@dataclass
class LeadTimeStats:
    """Statistics for a specific lead time"""
    lead_days: int
    hits: int
    misses: int
    false_alarms: int
    correct_negatives: int
    total: int
    accuracy: float
    pod: float  # Probability of Detection
    far: float  # False Alarm Ratio
    csi: float  # Critical Success Index
    bias: float  # Frequency Bias

@dataclass
class DateVerificationResult:
    """Complete verification results for a specific date"""
    date: str
    overall: Dict  # Combined stats from all lead times
    day1: Dict  # Day-1 specific results
    day2: Dict  # Day-2 specific results
    day3: Dict  # Day-3 specific results
    day4: Dict  # Day-4 specific results
    day5: Dict  # Day-5 specific results

class HeavyRainfallVerifier:
    """Enhanced verification engine for heavy rainfall forecasts"""
    
    def __init__(self, heavy_threshold: float = 64.5):
        """
        Initialize verifier with configurable heavy rainfall threshold
        
        Args:
            heavy_threshold: Rainfall threshold in mm for heavy rainfall classification
        """
        self.heavy_threshold = heavy_threshold
        self.parser = IMDDataParser(heavy_threshold=heavy_threshold)
        
    def verify_single_prediction(self, forecast_code: Optional[float], 
                                observed_rainfall: float) -> Tuple[str, str]:
        """
        Verify a single forecast-observation pair using 4-case logic
        
        Returns:
            (result_type, description)
        """
        forecast_heavy = self.parser.is_heavy_rainfall_forecast(forecast_code) if forecast_code is not None else False
        observed_heavy = self.parser.is_heavy_rainfall_observed(observed_rainfall)
        
        if forecast_heavy and observed_heavy:
            return 'Hit', 'Hit (Correct Heavy Rainfall Forecast)'
        elif not forecast_heavy and observed_heavy:
            return 'Miss', 'Miss (Heavy Rainfall Not Forecasted)'
        elif forecast_heavy and not observed_heavy:
            return 'False Alarm', 'False Alarm (Heavy Rainfall Forecasted, Not Observed)'
        else:
            return 'Correct Negative', 'Correct Negative (No Heavy Rainfall, Correctly Not Forecasted)'
    
    def verify_month(self, observed_data: Dict, forecast_data: Dict, 
                    target_month: str, target_year: int = 2025) -> List[VerificationResult]:
        """
        Perform verification for an entire month across all districts and lead times
        
        Args:
            observed_data: {district: {date: rainfall_mm}}
            forecast_data: {district: {issue_date: {D1: code, D2: code, ...}}}
            target_month: Month name (e.g., "June")
            target_year: Year (default 2025)
        
        Returns:
            List of VerificationResult objects
        """
        results = []
        
        # Determine month number and days
        month_map = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
            'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        
        month_num = month_map.get(target_month, 6)  # Default to June
        days_in_month = 30 if month_num == 6 else 31
        
        # Get all forecast districts
        forecast_districts = set(forecast_data.keys())
        
        print(f"\nVerifying {target_month} {target_year}")
        print(f"Forecast districts: {len(forecast_districts)}")
        
        for district in forecast_districts:
            # Try to find matching observed district
            observed_district = self.parser.map_district_name(district, list(observed_data.keys()))
            
            if not observed_district:
                print(f"Warning: No observed data found for forecast district '{district}'")
                continue
            
            for day in range(1, days_in_month + 1):
                verification_date = f"{target_year}-{month_num:02d}-{day:02d}"
                
                # Get observed rainfall for this date
                if verification_date not in observed_data[observed_district]:
                    continue
                
                observed_rainfall = observed_data[observed_district][verification_date]
                observed_heavy = self.parser.is_heavy_rainfall_observed(observed_rainfall)
                
                # Verify each lead time (Day-1 to Day-5)
                for lead_days in range(1, 6):
                    # Get forecast for this lead time
                    forecast_code = self.parser.get_forecast_for_verification(
                        forecast_data, district, verification_date, lead_days
                    )
                    
                    if forecast_code is None:
                        continue
                    
                    forecast_heavy = self.parser.is_heavy_rainfall_forecast(forecast_code)
                    
                    # Perform verification
                    result_type, description = self.verify_single_prediction(
                        forecast_code, observed_rainfall
                    )
                    
                    # Create verification result
                    result = VerificationResult(
                        district=district,
                        date=verification_date,
                        lead_days=lead_days,
                        forecast_code=forecast_code,
                        forecast_heavy=forecast_heavy,
                        observed_rainfall=observed_rainfall,
                        observed_heavy=observed_heavy,
                        result_type=result_type,
                        result_description=description
                    )
                    
                    results.append(result)
        
        print(f"Total verifications: {len(results)}")
        return results
    
    def calculate_lead_time_stats(self, verification_results: List[VerificationResult], 
                                  lead_days: int) -> LeadTimeStats:
        """
        Calculate statistics for a specific lead time
        
        Args:
            verification_results: List of all verification results
            lead_days: Lead time to calculate stats for (1-5)
        
        Returns:
            LeadTimeStats object with all calculated metrics
        """
        # Filter results for this lead time
        lead_results = [r for r in verification_results if r.lead_days == lead_days]
        
        if not lead_results:
            return LeadTimeStats(
                lead_days=lead_days, hits=0, misses=0, false_alarms=0,
                correct_negatives=0, total=0, accuracy=0.0, pod=0.0,
                far=0.0, csi=0.0, bias=0.0
            )
        
        # Count verification categories
        hits = len([r for r in lead_results if r.result_type == 'Hit'])
        misses = len([r for r in lead_results if r.result_type == 'Miss'])
        false_alarms = len([r for r in lead_results if r.result_type == 'False Alarm'])
        correct_negatives = len([r for r in lead_results if r.result_type == 'Correct Negative'])
        total = len(lead_results)
        
        # Calculate metrics
        accuracy = ((hits + correct_negatives) / total * 100) if total > 0 else 0.0
        pod = hits / (hits + misses) if (hits + misses) > 0 else 0.0
        far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0
        csi = hits / (hits + misses + false_alarms) if (hits + misses + false_alarms) > 0 else 0.0
        bias = (hits + false_alarms) / (hits + misses) if (hits + misses) > 0 else 0.0
        
        return LeadTimeStats(
            lead_days=lead_days,
            hits=hits,
            misses=misses,
            false_alarms=false_alarms,
            correct_negatives=correct_negatives,
            total=total,
            accuracy=accuracy,
            pod=pod,
            far=far,
            csi=csi,
            bias=bias
        )
    
    def get_date_verification(self, verification_results: List[VerificationResult],
                             target_date: str) -> DateVerificationResult:
        """
        Get complete verification results for a specific date
        Returns 6 tables: Overall + Day-1 to Day-5
        
        Args:
            verification_results: All verification results
            target_date: Date to analyze (YYYY-MM-DD)
        
        Returns:
            DateVerificationResult with 6 tables
        """
        # Filter results for this date
        date_results = [r for r in verification_results if r.date == target_date]
        
        if not date_results:
            return None
        
        # Build tables for each lead time
        tables = {}
        
        for lead_days in range(1, 6):
            lead_results = [r for r in date_results if r.lead_days == lead_days]
            
            verifications = []
            for r in lead_results:
                verifications.append(DistrictVerification(
                    district=r.district,
                    forecast_heavy=r.forecast_heavy,
                    forecast_rainfall=r.forecast_code,
                    observed_heavy=r.observed_heavy,
                    observed_rainfall=r.observed_rainfall,
                    result=r.result_type
                ))
            
            # Calculate stats
            hits = len([r for r in lead_results if r.result_type == 'Hit'])
            misses = len([r for r in lead_results if r.result_type == 'Miss'])
            false_alarms = len([r for r in lead_results if r.result_type == 'False Alarm'])
            correct_negatives = len([r for r in lead_results if r.result_type == 'Correct Negative'])
            total = len(lead_results)
            accuracy = ((hits + correct_negatives) / total * 100) if total > 0 else 0.0
            
            tables[f'day{lead_days}'] = {
                'verifications': verifications,
                'statistics': {
                    'hits': hits,
                    'misses': misses,
                    'false_alarms': false_alarms,
                    'correct_negatives': correct_negatives,
                    'total': total,
                    'accuracy': accuracy
                }
            }
        
        # Build overall table (combine all lead times)
        all_verifications = []
        for r in date_results:
            all_verifications.append(DistrictVerification(
                district=r.district,
                forecast_heavy=r.forecast_heavy,
                forecast_rainfall=r.forecast_code,
                observed_heavy=r.observed_heavy,
                observed_rainfall=r.observed_rainfall,
                result=r.result_type
            ))
        
        hits = len([r for r in date_results if r.result_type == 'Hit'])
        misses = len([r for r in date_results if r.result_type == 'Miss'])
        false_alarms = len([r for r in date_results if r.result_type == 'False Alarm'])
        correct_negatives = len([r for r in date_results if r.result_type == 'Correct Negative'])
        total = len(date_results)
        accuracy = ((hits + correct_negatives) / total * 100) if total > 0 else 0.0
        
        overall = {
            'verifications': all_verifications,
            'statistics': {
                'hits': hits,
                'misses': misses,
                'false_alarms': false_alarms,
                'correct_negatives': correct_negatives,
                'total': total,
                'accuracy': accuracy
            }
        }
        
        return DateVerificationResult(
            date=target_date,
            overall=overall,
            day1=tables['day1'],
            day2=tables['day2'],
            day3=tables['day3'],
            day4=tables['day4'],
            day5=tables['day5']
        )
    
    def run_full_verification(self, files_dir: str, target_month: str = "June") -> Dict:
        """
        Run complete verification analysis
        
        Args:
            files_dir: Path to directory containing IMD data files
            target_month: Month to analyze ("June" or "May")
        
        Returns:
            Dictionary with all verification results and statistics
        """
        print(f"\n{'='*80}")
        print(f"IMD Heavy Rainfall Verification System")
        print(f"{'='*80}")
        print(f"Loading IMD data from {files_dir}...")
        
        june_obs, may_obs, june_fc, may_fc = load_imd_data(files_dir, self.heavy_threshold)
        
        if target_month.lower() == "june":
            observed_data = june_obs
            forecast_data = june_fc
        else:
            observed_data = may_obs
            forecast_data = may_fc
        
        print(f"\nRunning verification for {target_month} with threshold {self.heavy_threshold}mm...")
        verification_results = self.verify_month(observed_data, forecast_data, target_month)
        
        # Calculate skill scores for each lead time
        skill_scores = {}
        for lead_days in range(1, 6):
            skill_scores[f"Day-{lead_days}"] = self.calculate_lead_time_stats(verification_results, lead_days)
        
        # Get unique dates
        unique_dates = sorted(set([r.date for r in verification_results]))
        
        # Get district list
        districts = sorted(set([r.district for r in verification_results]))
        
        return {
            'verification_results': verification_results,
            'skill_scores': skill_scores,
            'heavy_threshold': self.heavy_threshold,
            'target_month': target_month,
            'total_verifications': len(verification_results),
            'districts_analyzed': districts,
            'dates_analyzed': unique_dates,
            'observed_data': observed_data,
            'forecast_data': forecast_data
        }


# Test function
def test_verification():
    """Test the verification system"""
    files_dir = "/Users/divesh/Desktop/imd/imdfiles"
    
    print("\n" + "="*80)
    print("Testing Heavy Rainfall Verification System")
    print("="*80)
    
    verifier = HeavyRainfallVerifier(heavy_threshold=64.5)
    
    # Run verification for June
    results = verifier.run_full_verification(files_dir, "June")
    
    print(f"\n{'='*80}")
    print("VERIFICATION SUMMARY")
    print("="*80)
    print(f"Heavy Rainfall Threshold: {results['heavy_threshold']}mm")
    print(f"Total Verifications: {results['total_verifications']}")
    print(f"Districts Analyzed: {len(results['districts_analyzed'])}")
    print(f"Dates Analyzed: {len(results['dates_analyzed'])}")
    
    print(f"\n{'='*80}")
    print("SKILL SCORES BY LEAD TIME")
    print("="*80)
    for lead, scores in results['skill_scores'].items():
        print(f"\n{lead}:")
        print(f"  Total: {scores.total}")
        print(f"  Hits: {scores.hits}, Misses: {scores.misses}, False Alarms: {scores.false_alarms}, Correct Negatives: {scores.correct_negatives}")
        print(f"  Accuracy: {scores.accuracy:.1f}%")
        print(f"  POD: {scores.pod:.3f}, FAR: {scores.far:.3f}, CSI: {scores.csi:.3f}, Bias: {scores.bias:.3f}")
    
    # Test date-specific analysis
    if results['dates_analyzed']:
        sample_date = results['dates_analyzed'][10] if len(results['dates_analyzed']) > 10 else results['dates_analyzed'][0]
        print(f"\n{'='*80}")
        print(f"DATE-SPECIFIC ANALYSIS: {sample_date}")
        print("="*80)
        
        date_result = verifier.get_date_verification(results['verification_results'], sample_date)
        
        if date_result:
            print(f"\nOverall Statistics:")
            print(f"  Total: {date_result.overall['statistics']['total']}")
            print(f"  Accuracy: {date_result.overall['statistics']['accuracy']:.1f}%")
            
            for day_num in range(1, 6):
                day_key = f'day{day_num}'
                day_data = getattr(date_result, day_key)
                print(f"\nDay-{day_num} Statistics:")
                print(f"  Total: {day_data['statistics']['total']}")
                print(f"  Accuracy: {day_data['statistics']['accuracy']:.1f}%")
                print(f"  Hits: {day_data['statistics']['hits']}, Misses: {day_data['statistics']['misses']}")


if __name__ == "__main__":
    test_verification()
