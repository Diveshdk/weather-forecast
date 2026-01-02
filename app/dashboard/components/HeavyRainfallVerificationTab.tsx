'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface SkillScores {
  POD: number;
  FAR: number;
  CSI: number;
  Bias: number;
  Accuracy: number;
  H: number;
  M: number;
  F: number;
  CN: number;
  Total: number;
}

interface LeadTimeData {
  scores: SkillScores;
  count: number;
}

interface SpatialAccuracy {
  [district: string]: SkillScores;
}

interface VerificationResults {
  success: boolean;
  threshold: number;
  start_date: string;
  end_date: string;
  lead_times: {
    [key: string]: LeadTimeData;
  };
  spatial_accuracy?: SpatialAccuracy;
}

export default function HeavyRainfallVerificationTab() {
  const [threshold, setThreshold] = useState<number>(64.5);
  const [startDate, setStartDate] = useState<string>('2025-06-01');
  const [endDate, setEndDate] = useState<string>('2025-06-30');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VerificationResults | null>(null);

  const runVerification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/verification/heavy-rainfall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threshold,
          startDate,
          endDate,
          year: 2025,
          month: 6
        })
      });

      const result = await response.json();

      if (result.success) {
        setResults(result);
        toast.success('Verification completed successfully!');
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to run verification: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (value: number, metric: string) => {
    if (metric === 'FAR') {
      // Lower is better for FAR
      if (value <= 0.3) return 'text-green-600';
      if (value <= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // Higher is better for POD, CSI, Accuracy
      if (value >= 0.7) return 'text-green-600';
      if (value >= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 0.8) return 'bg-green-100 text-green-800';
    if (accuracy >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Heavy Rainfall Verification System
        </h2>
        <p className="text-gray-600 mb-6">
          Professional meteorological verification using contingency table methodology and standard skill scores
        </p>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heavy Rainfall Threshold (mm)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 64.5mm</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runVerification}
          disabled={isLoading}
          className={`px-6 py-3 rounded-md font-medium ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Running Verification...' : 'Run Heavy Rainfall Verification'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verification Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Threshold:</span>
                <span className="ml-2 font-semibold text-gray-900">{results.threshold}mm</span>
              </div>
              <div>
                <span className="text-gray-600">Date Range:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {format(new Date(results.start_date), 'MMM dd')} - {format(new Date(results.end_date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Lead Times:</span>
                <span className="ml-2 font-semibold text-gray-900">Day-1 to Day-5</span>
              </div>
              <div>
                <span className="text-gray-600">Districts:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {results.spatial_accuracy ? Object.keys(results.spatial_accuracy).length : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Lead-Time Verification Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Lead-Time Verification Results</h3>
              <p className="text-sm text-gray-600 mt-1">
                Contingency table and skill scores for each forecast lead time
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">H</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">M</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">F</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CN</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FAR</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CSI</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bias</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(results.lead_times).map(([leadTime, data]) => (
                    <tr key={leadTime} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {leadTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                        {data.scores.H}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600 font-semibold">
                        {data.scores.M}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-semibold">
                        {data.scores.F}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                        {data.scores.CN}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-semibold">
                        {data.scores.Total}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.POD, 'POD')}`}>
                        {data.scores.POD.toFixed(3)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.FAR, 'FAR')}`}>
                        {data.scores.FAR.toFixed(3)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(data.scores.CSI, 'CSI')}`}>
                        {data.scores.CSI.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-semibold">
                        {data.scores.Bias.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Contingency Table Legend:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center">
                  <span className="font-semibold text-green-600 mr-2">H:</span>
                  <span className="text-gray-600">Hits (Forecast YES, Observed YES)</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-red-600 mr-2">M:</span>
                  <span className="text-gray-600">Misses (Forecast NO, Observed YES)</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-orange-600 mr-2">F:</span>
                  <span className="text-gray-600">False Alarms (Forecast YES, Observed NO)</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-blue-600 mr-2">CN:</span>
                  <span className="text-gray-600">Correct Negatives (Forecast NO, Observed NO)</span>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-2">Skill Score Definitions:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                <div><span className="font-semibold">POD</span> (Probability of Detection) = H / (H + M)</div>
                <div><span className="font-semibold">FAR</span> (False Alarm Ratio) = F / (H + F)</div>
                <div><span className="font-semibold">CSI</span> (Critical Success Index) = H / (H + M + F)</div>
                <div><span className="font-semibold">Bias</span> (Frequency Bias) = (H + F) / (H + M)</div>
              </div>
            </div>
          </div>

          {/* Spatial Accuracy Table */}
          {results.spatial_accuracy && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">District-wise Spatial Accuracy</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Aggregated performance across all lead times for each district
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CSI</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">POD</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(results.spatial_accuracy)
                      .sort(([, a], [, b]) => b.Accuracy - a.Accuracy)
                      .map(([district, scores]) => {
                        const correct = scores.H + scores.CN;
                        return (
                          <tr key={district} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {district}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-semibold">
                              {correct}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                              {scores.Total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccuracyBadge(scores.Accuracy)}`}>
                                {(scores.Accuracy * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(scores.CSI, 'CSI')}`}>
                              {scores.CSI.toFixed(3)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${getScoreColor(scores.POD, 'POD')}`}>
                              {scores.POD.toFixed(3)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results State */}
      {!results && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-lg">Configure parameters and run verification to see results</p>
          <p className="text-gray-500 text-sm mt-2">Standard meteorological skill scores will be calculated for all lead times</p>
        </div>
      )}
    </div>
  );
}
