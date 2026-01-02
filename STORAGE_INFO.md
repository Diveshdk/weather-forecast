# IMD Heavy Rainfall Verification System - Data Storage Information

## 📁 **Where Your Data is Stored**

Your Heavy Rainfall Verification System stores all data locally in your web browser's **localStorage**. This means your data is:

- ✅ **Stored locally on your computer** - No data sent to external servers
- ✅ **Private and secure** - Only you can access your data
- ✅ **Persistent across browser sessions** - Data remains after closing the browser
- ✅ **Fast access** - No network delays for data retrieval

---

## 🗃️ **Storage Structure**

### **Primary Data Storage:**

| Storage Key | Description | Content |
|------------|-------------|---------|
| `imd_warning_data` | **Warning/Forecast Data** | District forecasts with 5-day rainfall predictions |
| `imd_realised_data` | **Realised/Observed Data** | Actual rainfall measurements from weather stations |
| `imd_comparison_data` | **Analysis Results** | Verification analysis comparing warnings vs reality |
| `imd_accuracy_stats` | **Performance Metrics** | Overall skill scores (POD, FAR, CSI, Bias) |

### **Metadata Storage:**

| Storage Key | Description | Content |
|------------|-------------|---------|
| `imd_warning_last_upload` | **Warning Upload Time** | Timestamp of last forecast data upload |
| `imd_realised_last_upload` | **Realised Upload Time** | Timestamp of last observed data upload |
| `imd_analysis_last_run` | **Analysis Time** | Timestamp of last verification analysis |

### **Daily Data Backup:**

| Storage Key Pattern | Description | Content |
|--------------------|-------------|---------|
| `imd_daily_YYYY-MM-DD` | **Daily Snapshots** | Backup of comparison data for specific dates |

---

## 📊 **Data Volume Information**

Based on your Excel files:

### **Realised Data (JUNE 2025.xls):**
- **11,062 entries** from **424 weather stations**
- **30 days** of June 2025 data
- **Storage size:** ~2-3 MB (estimated)

### **Warning Data (District Forecast June 2025.xlsx):**
- **1,710 forecast entries** for **30 districts**
- **5-day forecasts** across entire month
- **Storage size:** ~1-2 MB (estimated)

### **Analysis Results:**
- **Comparison data** with district + station columns
- **Statistical calculations** and skill scores
- **Storage size:** ~0.5-1 MB (estimated)

---

## 🔧 **Data Management Features**

The system includes several data management capabilities:

### **Data Overwriting:**
- **Monthly Mode:** Merges new data with existing, replacing duplicates
- **Daily Mode:** Overwrites all data for selected date range
- **Smart Merging:** Preserves non-conflicting data

### **Data Export:**
- **Word Reports:** Generates downloadable verification reports
- **CSV Exports:** Convert data to CSV format for external use
- **Analysis Summaries:** Export skill score calculations

### **Data Clearing:**
- **Clear All Data:** Remove all stored data and start fresh
- **Selective Clearing:** Clear specific data types (warnings, realised, analysis)

---

## 💡 **Important Notes**

### **Browser Limitations:**
- **Storage Limit:** ~5-10 MB per domain (varies by browser)
- **Browser Specific:** Data stored in one browser isn't accessible in another
- **Incognito Mode:** Data is cleared when private browsing session ends

### **Data Safety:**
- **Regular Backups:** Consider exporting important analysis results
- **Multiple Browsers:** Keep copies in different browsers for redundancy
- **Local Files:** Keep original Excel files as primary backup

### **Data Access:**
You can inspect your stored data by:
1. **Developer Tools:** F12 → Application/Storage → Local Storage
2. **Storage Info Panel:** Check the dashboard storage information section
3. **Export Functions:** Use built-in export features to view data

---

## 🎯 **New Feature: Station Name Column**

With the latest update, your analysis now includes:

- ✅ **District Column:** Shows the forecast district (e.g., "PALGHAR", "MUMBAI")
- ✅ **Station Column:** Shows the actual weather station name (e.g., "COLABA - IMD OBSY", "SANTA CRUZ")
- ✅ **Detailed Tracking:** Better granularity for verification analysis
- ✅ **Station-Level Accuracy:** Compare district forecasts with individual station observations

This helps you understand how well district-level forecasts perform against specific weather station measurements!
