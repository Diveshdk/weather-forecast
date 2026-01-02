// Utility functions for file processing and validation

export const validateWarningFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          resolve(false);
          return;
        }

        const header = lines[0].toLowerCase();
        const requiredColumns = ['district', 'day1_date', 'day1_rainfall_mm', 'day2_date', 'day2_rainfall_mm', 'day3_date', 'day3_rainfall_mm', 'day4_date', 'day4_rainfall_mm', 'day5_date', 'day5_rainfall_mm'];
        
        const hasAllColumns = requiredColumns.every(col => 
          header.includes(col.replace('_', '')) || header.includes(col)
        );
        
        resolve(hasAllColumns);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

export const validateRealisedFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          resolve(false);
          return;
        }

        const header = lines[0].toLowerCase();
        const requiredColumns = ['district', 'date', 'rainfall_mm'];
        
        const hasAllColumns = requiredColumns.every(col => 
          header.includes(col.replace('_', '')) || header.includes(col)
        );
        
        resolve(hasAllColumns);
      } catch {
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

export const maharashtraDistricts = [
  'Mumbai City', 'Mumbai Suburban', 'Thane', 'Raigad', 'Palghar',
  'Nashik', 'Ahmednagar', 'Pune', 'Satara', 'Sangli', 'Kolhapur',
  'Ratnagiri', 'Sindhudurg', 'Dhule', 'Nandurbar', 'Jalgaon',
  'Aurangabad', 'Jalna', 'Beed', 'Latur', 'Osmanabad', 'Solapur',
  'Akola', 'Amravati', 'Buldhana', 'Washim', 'Yavatmal', 'Wardha',
  'Nagpur', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli',
  'Nanded', 'Hingoli', 'Parbhani'
];

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const classifyRainfall = (rainfall: number): 'Y' | 'N' => {
  return rainfall > 64.5 ? 'Y' : 'N';
};

export const calculateAccuracyMetrics = (comparisonData: any[]) => {
  let correct = 0;
  let falseAlarms = 0;
  let missedEvents = 0;
  let correctNonEvents = 0;

  comparisonData.forEach(item => {
    if (item.match) {
      if (item.warning === 'Y') {
        correct++;
      } else {
        correctNonEvents++;
      }
    } else {
      if (item.warning === 'Y' && item.realised === 'N') {
        falseAlarms++;
      } else if (item.warning === 'N' && item.realised === 'Y') {
        missedEvents++;
      }
    }
  });

  const totalCorrect = correct + correctNonEvents;
  const total = comparisonData.length;

  return {
    totalPredictions: total,
    correct: totalCorrect,
    falseAlarms,
    missedEvents,
    correctEvents: correct,
    correctNonEvents,
    accuracy: total > 0 ? (totalCorrect / total) * 100 : 0,
    hitRate: (correct + missedEvents) > 0 ? (correct / (correct + missedEvents)) * 100 : 0,
    falseAlarmRate: (falseAlarms + correctNonEvents) > 0 ? (falseAlarms / (falseAlarms + correctNonEvents)) * 100 : 0
  };
};
