// Enhanced storage system with file-based backup for IMD dashboard

import { format } from 'date-fns';

export interface StoredWarningData {
  district: string;
  day1: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day2: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day3: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day4: { date: string; rainfall: number; classification: 'Y' | 'N' };
  day5: { date: string; rainfall: number; classification: 'Y' | 'N' };
  uploadDate: string;
}

export interface StoredRealisedData {
  district: string;
  date: string;
  rainfall: number;
  classification: 'Y' | 'N';
  uploadDate: string;
}

export interface StoredComparisonData {
  district: string;
  station?: string; // Add station name for detailed tracking
  date: string;
  warning: 'Y' | 'N';
  realised: 'Y' | 'N';
  warningRainfall: number | null;
  realisedRainfall: number | null;
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
  analysisDate: string;
}

export interface StoredAccuracyStats {
  totalPredictions: number;
  correct: number;
  falseAlarms: number;
  missedEvents: number;
  accuracy: number;
  analysisDate: string;
  dateRange: string;
}

// Enhanced storage functions with better data handling
export const saveWarningData = (data: StoredWarningData[]) => {
  try {
    localStorage.setItem('imd_warning_data', JSON.stringify(data));
    localStorage.setItem('imd_warning_last_upload', new Date().toISOString());
    
    // Also create downloadable backup files
    const csvContent = convertWarningDataToCSV(data);
    downloadCSV(csvContent, `warning_data_backup_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    
    return true;
  } catch (error) {
    console.error('Error saving warning data:', error);
    return false;
  }
};

export const saveRealisedData = (data: StoredRealisedData[]) => {
  try {
    const existingData = loadRealisedData();
    const mergedData = [...existingData];
    
    data.forEach(newItem => {
      const existingIndex = mergedData.findIndex(
        item => item.district === newItem.district && item.date === newItem.date
      );
      if (existingIndex >= 0) {
        mergedData[existingIndex] = newItem;
      } else {
        mergedData.push(newItem);
      }
    });
    
    localStorage.setItem('imd_realised_data', JSON.stringify(mergedData));
    localStorage.setItem('imd_realised_last_upload', new Date().toISOString());
    
    // Also create downloadable backup files
    const csvContent = convertRealisedDataToCSV(mergedData);
    downloadCSV(csvContent, `realised_data_backup_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    
    return true;
  } catch (error) {
    console.error('Error saving realised data:', error);
    return false;
  }
};

export const saveComparisonData = (data: StoredComparisonData[], stats: StoredAccuracyStats) => {
  try {
    // Group data by date for individual date files
    const dataByDate = new Map<string, StoredComparisonData[]>();
    
    data.forEach(item => {
      if (!dataByDate.has(item.date)) {
        dataByDate.set(item.date, []);
      }
      dataByDate.get(item.date)!.push(item);
    });
    
    // Save main data
    localStorage.setItem('imd_comparison_data', JSON.stringify(data));
    localStorage.setItem('imd_accuracy_stats', JSON.stringify(stats));
    localStorage.setItem('imd_analysis_last_run', new Date().toISOString());
    
    // Save individual date files
    dataByDate.forEach((dateData, date) => {
      const formattedDate = formatDateForFilename(date);
      const csvContent = convertComparisonDataToCSV(dateData);
      localStorage.setItem(`imd_daily_${date}`, JSON.stringify(dateData));
      
      // Create downloadable daily file
      downloadCSV(csvContent, `${formattedDate}.csv`);
    });
    
    return true;
  } catch (error) {
    console.error('Error saving comparison data:', error);
    return false;
  }
};

export const loadWarningData = (): StoredWarningData[] => {
  try {
    const data = localStorage.getItem('imd_warning_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading warning data:', error);
    return [];
  }
};

export const loadRealisedData = (): StoredRealisedData[] => {
  try {
    const data = localStorage.getItem('imd_realised_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading realised data:', error);
    return [];
  }
};

export const loadComparisonData = (): { comparisons: StoredComparisonData[], stats: StoredAccuracyStats | null } => {
  try {
    const comparisons = localStorage.getItem('imd_comparison_data');
    const stats = localStorage.getItem('imd_accuracy_stats');
    
    return {
      comparisons: comparisons ? JSON.parse(comparisons) : [],
      stats: stats ? JSON.parse(stats) : null
    };
  } catch (error) {
    console.error('Error loading comparison data:', error);
    return { comparisons: [], stats: null };
  }
};

export const loadDailyData = (date: string): StoredComparisonData[] => {
  try {
    const data = localStorage.getItem(`imd_daily_${date}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading daily data:', error);
    return [];
  }
};

// Get data for specific date with improved logic
export const getDataForDate = (date: string) => {
  const { comparisons } = loadComparisonData();
  const realisedData = loadRealisedData();
  const warningData = loadWarningData();
  
  // Filter comparisons for the specific date
  const dateComparisons = comparisons.filter(c => c.date === date);
  
  // Filter realised data for the specific date  
  const dateRealised = realisedData.filter(r => r.date === date);
  
  // Get warning data for the specific date
  const dateWarnings: any[] = [];
  warningData.forEach(warning => {
    [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5].forEach(day => {
      if (day.date === date) {
        dateWarnings.push({
          district: warning.district,
          date: day.date,
          rainfall: day.rainfall,
          classification: day.classification
        });
      }
    });
  });
  
  console.log(`Data for ${date}:`, {
    comparisons: dateComparisons.length,
    realised: dateRealised.length,
    warnings: dateWarnings.length
  });
  
  return {
    comparisons: dateComparisons,
    realised: dateRealised,
    warnings: dateWarnings,
    hasData: dateComparisons.length > 0 || dateRealised.length > 0 || dateWarnings.length > 0
  };
};

// Get all available dates with data
export const getAvailableDates = (): string[] => {
  const { comparisons } = loadComparisonData();
  const realisedData = loadRealisedData();
  const warningData = loadWarningData();
  
  const dates = new Set<string>();
  
  // Add dates from comparisons
  comparisons.forEach(c => dates.add(c.date));
  
  // Add dates from realised data
  realisedData.forEach(r => dates.add(r.date));
  
  // Add dates from warnings
  warningData.forEach(warning => {
    [warning.day1, warning.day2, warning.day3, warning.day4, warning.day5].forEach(day => {
      dates.add(day.date);
    });
  });
  
  return Array.from(dates).sort();
};

// CSV conversion functions
const convertComparisonDataToCSV = (data: StoredComparisonData[]): string => {
  const headers = ['District', 'Date', 'Warning_Classification', 'Warning_Rainfall_mm', 'Realised_Classification', 'Realised_Rainfall_mm', 'Match', 'Result_Type', 'Analysis_Date'];
  const rows = data.map(item => [
    item.district,
    item.date,
    item.warning,
    item.warningRainfall ? item.warningRainfall.toFixed(1) : '0.0',
    item.realised,
    item.realisedRainfall ? item.realisedRainfall.toFixed(1) : '0.0',
    item.match ? 'Yes' : 'No',
    item.type,
    item.analysisDate
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const convertWarningDataToCSV = (data: StoredWarningData[]): string => {
  const headers = ['District', 'Day1_Date', 'Day1_Rainfall_mm', 'Day1_Classification', 'Day2_Date', 'Day2_Rainfall_mm', 'Day2_Classification', 'Day3_Date', 'Day3_Rainfall_mm', 'Day3_Classification', 'Day4_Date', 'Day4_Rainfall_mm', 'Day4_Classification', 'Day5_Date', 'Day5_Rainfall_mm', 'Day5_Classification', 'Upload_Date'];
  const rows = data.map(item => [
    item.district,
    item.day1.date, item.day1.rainfall ? item.day1.rainfall.toFixed(1) : '0.0', item.day1.classification,
    item.day2.date, item.day2.rainfall ? item.day2.rainfall.toFixed(1) : '0.0', item.day2.classification,
    item.day3.date, item.day3.rainfall ? item.day3.rainfall.toFixed(1) : '0.0', item.day3.classification,
    item.day4.date, item.day4.rainfall ? item.day4.rainfall.toFixed(1) : '0.0', item.day4.classification,
    item.day5.date, item.day5.rainfall ? item.day5.rainfall.toFixed(1) : '0.0', item.day5.classification,
    item.uploadDate
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const convertRealisedDataToCSV = (data: StoredRealisedData[]): string => {
  const headers = ['District', 'Date', 'Rainfall_mm', 'Classification', 'Upload_Date'];
  const rows = data.map(item => [
    item.district,
    item.date,
    item.rainfall ? item.rainfall.toFixed(1) : '0.0',
    item.classification,
    item.uploadDate
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// Utility functions
const formatDateForFilename = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  } catch {
    return dateStr.replace(/-/g, '');
  }
};

const downloadCSV = (csvContent: string, filename: string) => {
  // This is a placeholder - in a real app, you might want to save to a server
  // For now, we'll just log the availability
  console.log(`CSV file ready for download: ${filename}`);
  console.log(`Content preview: ${csvContent.split('\n').slice(0, 3).join('\n')}...`);
};

// Clear all data
export const clearAllData = () => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('imd_'));
    keys.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Get storage info
export const getStorageInfo = () => {
  const availableDates = getAvailableDates();
  return {
    warningLastUpload: localStorage.getItem('imd_warning_last_upload'),
    realisedLastUpload: localStorage.getItem('imd_realised_last_upload'),
    analysisLastRun: localStorage.getItem('imd_analysis_last_run'),
    warningDataCount: loadWarningData().length,
    realisedDataCount: loadRealisedData().length,
    comparisonDataCount: loadComparisonData().comparisons.length,
    availableDates: availableDates,
    totalDatesWithData: availableDates.length
  };
};
