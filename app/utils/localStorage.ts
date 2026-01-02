// Local storage utilities for IMD dashboard data persistence

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
  date: string;
  warning: 'Y' | 'N';
  realised: 'Y' | 'N';
  warningRainfall: number;
  realisedRainfall: number;
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

// Warning data storage
export const saveWarningData = (data: StoredWarningData[]) => {
  try {
    localStorage.setItem('imd_warning_data', JSON.stringify(data));
    localStorage.setItem('imd_warning_last_upload', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving warning data:', error);
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

// Realised data storage
export const saveRealisedData = (data: StoredRealisedData[]) => {
  try {
    const existingData = loadRealisedData();
    // Merge with existing data, avoiding duplicates
    const mergedData = [...existingData];
    
    data.forEach(newItem => {
      const existingIndex = mergedData.findIndex(
        item => item.district === newItem.district && item.date === newItem.date
      );
      if (existingIndex >= 0) {
        mergedData[existingIndex] = newItem; // Update existing
      } else {
        mergedData.push(newItem); // Add new
      }
    });
    
    localStorage.setItem('imd_realised_data', JSON.stringify(mergedData));
    localStorage.setItem('imd_realised_last_upload', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving realised data:', error);
    return false;
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

// Comparison data storage
export const saveComparisonData = (data: StoredComparisonData[], stats: StoredAccuracyStats) => {
  try {
    localStorage.setItem('imd_comparison_data', JSON.stringify(data));
    localStorage.setItem('imd_accuracy_stats', JSON.stringify(stats));
    localStorage.setItem('imd_analysis_last_run', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving comparison data:', error);
    return false;
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

// Get data for specific date
export const getDataForDate = (date: string) => {
  const { comparisons } = loadComparisonData();
  const realisedData = loadRealisedData();
  const warningData = loadWarningData();
  
  const dateComparisons = comparisons.filter(c => c.date === date);
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
  
  return {
    comparisons: dateComparisons,
    realised: dateRealised,
    warnings: dateWarnings,
    hasData: dateComparisons.length > 0 || dateRealised.length > 0 || dateWarnings.length > 0
  };
};

// Clear all data
export const clearAllData = () => {
  try {
    localStorage.removeItem('imd_warning_data');
    localStorage.removeItem('imd_realised_data');
    localStorage.removeItem('imd_comparison_data');
    localStorage.removeItem('imd_accuracy_stats');
    localStorage.removeItem('imd_warning_last_upload');
    localStorage.removeItem('imd_realised_last_upload');
    localStorage.removeItem('imd_analysis_last_run');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Get storage info
export const getStorageInfo = () => {
  return {
    warningLastUpload: localStorage.getItem('imd_warning_last_upload'),
    realisedLastUpload: localStorage.getItem('imd_realised_last_upload'),
    analysisLastRun: localStorage.getItem('imd_analysis_last_run'),
    warningDataCount: loadWarningData().length,
    realisedDataCount: loadRealisedData().length,
    comparisonDataCount: loadComparisonData().comparisons.length
  };
};
