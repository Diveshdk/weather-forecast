'use client';

import React from 'react';

interface DistrictVerification {
  district: string;
  date: string;
  forecastCode: number | null;
  forecastClassification: string;
  realisedRainfall: number | null;
  realisedClassification: string;
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
}

interface TableStatistics {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctNegatives: number;
  total: number;
  accuracy: number;
}

interface LeadTimeTableData {
  verifications: DistrictVerification[];
  statistics: TableStatistics;
}

interface DateVerificationViewProps {
  selectedDate: string;
  overall: LeadTimeTableData;
  day1: LeadTimeTableData;
  day2: LeadTimeTableData;
  day3: LeadTimeTableData;
  day4: LeadTimeTableData;
  day5: LeadTimeTableData;
}

export default function DateVerificationView({
  selectedDate,
  overall,
  day1,
  day2,
  day3,
  day4,
  day5
}: DateVerificationViewProps) {
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Hit':
        return 'bg-green-100 text-green-800';
      case 'Miss':
        return 'bg-red-100 text-red-800';
      case 'False Alarm':
        return 'bg-yellow-100 text-yellow-800';
      case 'Correct Negative':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Hit':
        return '✓';
      case 'Miss':
        return '✗';
      case 'False Alarm':
        return '⚠';
      case 'Correct Negative':
        return '○';
      default:
        return '';
    }
  };

  const renderVerificationTable = (
    title: string,
    data: LeadTimeTableData,
    leadDays?: number
  ) => {
    if (!data || !data.verifications || data.verifications.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
          <p className="text-gray-500">No data available for this lead time.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <div className="text-sm text-gray-600">
            Accuracy: <span className="font-bold text-blue-600">{data.statistics.accuracy.toFixed(1)}%</span>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{data.statistics.hits}</div>
            <div className="text-xs text-green-600">Hits</div>
          </div>
          <div className="bg-red-50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{data.statistics.misses}</div>
            <div className="text-xs text-red-600">Misses</div>
          </div>
          <div className="bg-yellow-50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{data.statistics.falseAlarms}</div>
            <div className="text-xs text-yellow-600">False Alarms</div>
          </div>
          <div className="bg-blue-50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{data.statistics.correctNegatives}</div>
            <div className="text-xs text-blue-600">Correct Negatives</div>
          </div>
        </div>

        {/* Verification Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forecast
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forecast Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realised
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realised Rainfall (mm)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.verifications.map((verification, index) => (
                <tr key={`${verification.district}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {verification.district}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {verification.date}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-semibold text-blue-700">
                      {verification.forecastClassification || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {verification.forecastCode !== null ? verification.forecastCode : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-semibold text-green-700">
                      {verification.realisedClassification || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {verification.realisedRainfall !== null && verification.realisedRainfall !== undefined
                      ? verification.realisedRainfall.toFixed(1)
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      verification.type === 'Correct' ? 'bg-green-100 text-green-800' :
                      verification.type === 'False Alarm' ? 'bg-yellow-100 text-yellow-800' :
                      verification.type === 'Missed Event' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {verification.type === 'Correct' ? '✓ Correct' :
                       verification.type === 'False Alarm' ? '⚠ False Alarm' :
                       verification.type === 'Missed Event' ? '✗ Missed' :
                       '○ Correct Non-Event'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Verification Results for {formatDate(selectedDate)}
        </h2>
        <p className="text-blue-100">
          Detailed forecast verification across all lead times (Day-1 to Day-5)
        </p>
      </div>

      {/* Overall Table */}
      {renderVerificationTable('Overall Verification (All Lead Times)', overall)}

      {/* Lead Time Tables */}
      <div className="grid grid-cols-1 gap-6">
        {renderVerificationTable('Day-1 Forecast (Issued on Verification Date)', day1, 1)}
        {renderVerificationTable('Day-2 Forecast (Issued 1 Day Before)', day2, 2)}
        {renderVerificationTable('Day-3 Forecast (Issued 2 Days Before)', day3, 3)}
        {renderVerificationTable('Day-4 Forecast (Issued 3 Days Before)', day4, 4)}
        {renderVerificationTable('Day-5 Forecast (Issued 4 Days Before)', day5, 5)}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Result Types:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">✓ Hit</span>
            <span className="text-gray-600">Heavy forecasted & observed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">✗ Miss</span>
            <span className="text-gray-600">Heavy observed, not forecasted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">⚠ False Alarm</span>
            <span className="text-gray-600">Heavy forecasted, not observed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">○ Correct Negative</span>
            <span className="text-gray-600">No heavy rain, correctly forecasted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
