# IMD Rainfall Forecast Data Format

## File Upload Requirements

### 1. Warning (Forecast) Data Format

**File Types Accepted:** `.csv` or `.xlsx`

**Required Columns:**
- `District`: Name of the district
- `Day1_Date`: First day forecast date (YYYY-MM-DD)
- `Day1_Rainfall_mm`: Rainfall prediction for day 1 in millimeters
- `Day2_Date`: Second day forecast date (YYYY-MM-DD)
- `Day2_Rainfall_mm`: Rainfall prediction for day 2 in millimeters
- `Day3_Date`: Third day forecast date (YYYY-MM-DD)
- `Day3_Rainfall_mm`: Rainfall prediction for day 3 in millimeters
- `Day4_Date`: Fourth day forecast date (YYYY-MM-DD)
- `Day4_Rainfall_mm`: Rainfall prediction for day 4 in millimeters
- `Day5_Date`: Fifth day forecast date (YYYY-MM-DD)
- `Day5_Rainfall_mm`: Rainfall prediction for day 5 in millimeters

**Sample File:** `sample_warning_data.csv`

### 2. Realised (Observed) Data Format

**File Types Accepted:** `.csv` or `.xlsx`

**Required Columns:**
- `District`: Name of the district (must match district names in warning data)
- `Date`: Date of observation (YYYY-MM-DD)
- `Rainfall_mm`: Actual rainfall recorded in millimeters

**Sample File:** `sample_realised_data.csv`

## Important Notes

1. **District Names:** Must be consistent between warning and realised data files
2. **Date Format:** Always use YYYY-MM-DD format (e.g., 2024-12-18)
3. **Rainfall Values:** Enter numerical values in millimeters (e.g., 65.4, 12.8)
4. **Classification:** System automatically classifies rainfall as:
   - **Y (Significant):** > 64.5 mm
   - **N (Not Significant):** ≤ 64.5 mm

## Maharashtra Districts Covered

Mumbai City, Mumbai Suburban, Thane, Raigad, Palghar, Nashik, Ahmednagar, Pune, Satara, Sangli, Kolhapur, Ratnagiri, Sindhudurg, Dhule, Nandurbar, Jalgaon, Aurangabad, Jalna, Beed, Latur, Osmanabad, Solapur, Akola, Amravati, Buldhana, Washim, Yavatmal, Wardha, Nagpur, Bhandara, Gondia, Chandrapur, Gadchiroli, Nanded, Hingoli, Parbhani

## Workflow

1. **Daily Upload:** Upload 5-day forecast (warning) data every day
2. **Previous Day Upload:** Upload previous day's realised (observed) data
3. **Analysis:** System compares warning vs realised data for accuracy
4. **Reports:** Generate daily verification reports for completed days only
