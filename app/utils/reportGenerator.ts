import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';

interface AccuracyStats {
  totalPredictions: number;
  correct: number;
  falseAlarms: number;
  missedEvents: number;
  accuracy: number;
}

interface ComparisonData {
  district: string;
  date: string;
  warning: 'Y' | 'N';
  realised: 'Y' | 'N';
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
}

export const generateWordReport = async (
  accuracyStats: AccuracyStats,
  comparisonData: ComparisonData[],
  dateRange: string
) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({
                text: "INDIAN METEOROLOGICAL DEPARTMENT",
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "MUMBAI REGIONAL CENTRE",
                bold: true,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "RAINFALL FORECAST VERIFICATION REPORT",
                bold: true,
                size: 20,
                underline: {},
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Report Period
          new Paragraph({
            children: [
              new TextRun({
                text: `Report Period: ${dateRange}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Executive Summary
          new Paragraph({
            children: [
              new TextRun({
                text: "EXECUTIVE SUMMARY",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `This report presents the verification analysis of rainfall forecasts issued by IMD Mumbai Regional Centre. A total of ${accuracyStats.totalPredictions} district-wise predictions were analyzed with an overall forecast accuracy of ${accuracyStats.accuracy.toFixed(2)}%.`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "REPORT METHODOLOGY",
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Warning Threshold: Rainfall predictions > 64.5mm are classified as heavy rainfall warnings",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Verification Categories:",
                size: 20,
                bold: true,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "  - Correct: Warning issued and heavy rainfall occurred (>64.5mm)",
                size: 20,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "  - False Alarm: Warning issued but no heavy rainfall occurred",
                size: 20,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "  - Missed Event: No warning issued but heavy rainfall occurred",
                size: 20,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "  - Correct Non-Event: No warning issued and no heavy rainfall occurred",
                size: 20,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Key Statistics Table
          new Paragraph({
            children: [
              new TextRun({
                text: "FORECAST VERIFICATION STATISTICS",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 },
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Percentage", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Predictions" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: accuracyStats.totalPredictions.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "100.0%" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Correct Predictions" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: accuracyStats.correct.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((accuracyStats.correct / accuracyStats.totalPredictions) * 100).toFixed(1)}%` })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "False Alarms" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: accuracyStats.falseAlarms.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((accuracyStats.falseAlarms / accuracyStats.totalPredictions) * 100).toFixed(1)}%` })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Missed Events" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: accuracyStats.missedEvents.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((accuracyStats.missedEvents / accuracyStats.totalPredictions) * 100).toFixed(1)}%` })] })] }),
                ],
              }),
            ],
          }),

          // Analysis
          new Paragraph({
            children: [
              new TextRun({
                text: "DETAILED ANALYSIS",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Classification Methodology:",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Rainfall > 64.5 mm classified as 'Y' (Significant Rainfall Expected/Observed)",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Rainfall ≤ 64.5 mm classified as 'N' (No Significant Rainfall Expected/Observed)",
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Verification Categories:",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Correct Prediction: Forecast and observation match (Y-Y or N-N)",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• False Alarm: Significant rainfall predicted but not observed (Y-N)",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Missed Event: Significant rainfall occurred but not predicted (N-Y)",
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // District-wise Performance Summary
          new Paragraph({
            children: [
              new TextRun({
                text: "DISTRICT-WISE PERFORMANCE",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // Create district performance table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "District", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Total Predictions", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Correct", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "False Alarms", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Missed Events", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Accuracy %", bold: true })] })],
                    shading: { fill: "D3D3D3" },
                  }),
                ],
              }),
              // Add all district rows (not just first 10)
              ...getDistrictPerformance(comparisonData).map(district => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district.name })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district.total.toString() })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district.correct.toString() })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district.falseAlarms.toString() })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: district.missedEvents.toString() })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${district.accuracy.toFixed(1)}%` })] })] }),
                  ],
                })
              ),
            ],
          }),

          // Conclusions
          new Paragraph({
            children: [
              new TextRun({
                text: "CONCLUSIONS AND RECOMMENDATIONS",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `The overall forecast accuracy of ${accuracyStats.accuracy.toFixed(1)}% demonstrates ${
                  accuracyStats.accuracy >= 75 ? 'excellent' : 
                  accuracyStats.accuracy >= 65 ? 'good' : 
                  accuracyStats.accuracy >= 55 ? 'satisfactory' : 'below average'
                } performance in rainfall prediction for the analyzed period.`,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${accuracyStats.falseAlarms > accuracyStats.missedEvents ? 
                  'The forecast system shows a tendency towards overestimation (more false alarms than missed events), which is generally preferable from a preparedness perspective.' :
                  'The forecast system shows balanced performance between false alarms and missed events.'
                }`,
                size: 22,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Report generated by IMD Mumbai Rainfall Forecast Verification System",
                size: 20,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} IST`,
                size: 18,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

function getDistrictPerformance(comparisonData: ComparisonData[]) {
  const districtMap = new Map<string, { 
    total: number; 
    correct: number; 
    falseAlarms: number; 
    missedEvents: number; 
  }>();
  
  comparisonData.forEach(item => {
    const current = districtMap.get(item.district) || { 
      total: 0, 
      correct: 0, 
      falseAlarms: 0, 
      missedEvents: 0 
    };
    
    current.total++;
    
    // Determine the type of prediction outcome
    const warningIssued = parseFloat(item.warning) > 64.5;
    const eventOccurred = parseFloat(item.realised) > 64.5;
    
    if (warningIssued && eventOccurred) {
      current.correct++; // Correct prediction
    } else if (warningIssued && !eventOccurred) {
      current.falseAlarms++; // False alarm
    } else if (!warningIssued && eventOccurred) {
      current.missedEvents++; // Missed event
    } else {
      current.correct++; // Correct non-event
    }
    
    districtMap.set(item.district, current);
  });

  return Array.from(districtMap.entries()).map(([name, stats]) => ({
    name,
    total: stats.total,
    correct: stats.correct,
    falseAlarms: stats.falseAlarms,
    missedEvents: stats.missedEvents,
    // Calculate accuracy based on event predictions only (not including correct non-events)
    // This is more meaningful for rainfall forecasting where we focus on predicting significant events
    accuracy: (stats.correct + stats.falseAlarms + stats.missedEvents) > 0 ? 
      (stats.correct / (stats.correct + stats.falseAlarms + stats.missedEvents)) * 100 : 
      // If no events predicted or occurred, use traditional accuracy
      stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);
}
