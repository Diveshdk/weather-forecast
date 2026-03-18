# Sample Excel Files for IMD Upload System

## 📁 Files Created

1. **sample_warning_june_2025.xlsx** - Sample Warning data
2. **sample_realised_june_2025.xlsx** - Sample Realised (Observed) data

## 📊 File Format

Both files follow the same structure:

```
District         | 1    | 2    | 3    | ... | 30
PALGHAR         | 5    | 0    | 7    | ... | 0
THANE           | 0    | 5    | 0    | ... | 8
MUMBAI          | 7    | 0    | 5    | ... | 0
...
```

- **Column 1**: District name
- **Columns 2-31**: Day numbers (1-30 for June)

## 🏛️ Districts Included (28 total)

All Maharashtra districts from your system:
- PALGHAR, THANE, MUMBAI, RAIGAD, RATNAGIRI, SINDHUDURG
- DHULE, NANDURBAR, JALGAON, NASIK, Ghats of NASIK
- AHMEDNAGAR, PUNE, Ghats of PUNE
- Ghats of KOLHAPUR, KOLHAPUR, SATARA, SOUTH SATARA, SANGLI
- SHOLAPUR, CHHATRAPATI SAMBHAJINAGAR, JALNA, PARBHANI
- BEED, HINGOLI, NANDED, LATUR, DHARASHIV

## 📤 How to Upload

### Warning Data:
1. Go to Dashboard → **Upload Data (New)** tab
2. Click **Upload Warning** tab
3. Select `sample_warning_june_2025.xlsx`
4. Set:
   - **Year**: 2025
   - **Month**: June
   - **Lead Day**: D1 (or D2, D3, D4, D5)
5. Click **Upload Data**

### Realised Data:
1. Go to Dashboard → **Upload Data (New)** tab
2. Click **Upload Realised** tab
3. Select `sample_realised_june_2025.xlsx`
4. Set:
   - **Year**: 2025
   - **Month**: June
5. Click **Upload Data**

## 📋 Data Details

### Warning File:
- **Warning Codes**: 0, 5, 7, 8, 10, 12
  - 0 = No warning
  - 5 = Light rainfall warning
  - 7 = Moderate rainfall warning
  - 8 = Heavy rainfall warning
  - 10 = Very heavy rainfall warning
  - 12 = Extremely heavy rainfall warning

### Realised File:
- **Rainfall Values**: In millimeters (mm)
- **Range**: 0 to 125.3 mm
- **Examples**: 0, 5.5, 12.3, 25.8, 45.2, 67.8, 89.5, 125.3

## 🔄 Testing Multiple Lead Days

To test the full lead-day system, upload the **same warning file** 5 times with different lead days:

1. Upload with Lead Day = **D1**
2. Upload with Lead Day = **D2**
3. Upload with Lead Day = **D3**
4. Upload with Lead Day = **D4**
5. Upload with Lead Day = **D5**

This will create separate files for each lead day in the storage structure:
```
/data/warning/2025/06/
  ├── D1/
  ├── D2/
  ├── D3/
  ├── D4/
  └── D5/
```

## ✅ Expected Results

After uploading both files, you should see:
- 30 JSON files in `/data/warning/2025/06/D1/` (01.json to 30.json)
- 30 JSON files in `/data/realised/2025/06/` (01.json to 30.json)
- Upload summary showing 30 days processed
- No errors (all districts match the expected format)

## 🎯 Next Steps

1. Upload the sample files using the instructions above
2. Navigate to the Analysis or Verification tabs
3. Select June 2025 as the date range
4. Run verification to see how the system compares warnings vs realised data

## 📝 Creating Your Own Files

To create your own Excel files:
1. Use the same format (District | 1 | 2 | 3 | ... | 30/31)
2. Include all districts you want to analyze
3. For Warning: Use integer warning codes
4. For Realised: Use decimal rainfall values in mm
5. Ensure the number of day columns matches the month (28-31)

---

**Generated**: January 2026  
**Month**: June 2025 (30 days)  
**Districts**: 28 Maharashtra districts
