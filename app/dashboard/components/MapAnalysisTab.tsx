'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import { RAINFALL_CATEGORIES } from '@/app/utils/rainfallColors';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapVisualization = dynamic(() => import('@/app/dashboard/components/MapVisualization'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface DistrictRainfall {
  district: string;
  rainfall: number;
}

export default function MapAnalysisTab() {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [rainfallData, setRainfallData] = useState<DistrictRainfall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classificationMode, setClassificationMode] = useState<'dual' | 'multi'>('multi');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(monthStr);
  }, []);

  // Fetch data when view mode or date/month changes
  useEffect(() => {
    if (viewMode === 'daily' && selectedDate) {
      fetchRainfallData('daily', selectedDate);
    } else if (viewMode === 'monthly' && selectedMonth) {
      fetchRainfallData('monthly', selectedMonth);
    }
  }, [viewMode, selectedDate, selectedMonth]);

  // Fetch current classification mode on mount
  useEffect(() => {
    const fetchClassificationMode = async () => {
      try {
        const response = await fetch('/api/rainfall-mode');
        const data = await response.json();
        if (response.ok && data.mode) {
          setClassificationMode(data.mode);
        }
      } catch (error) {
        console.error('Error fetching classification mode:', error);
      }
    };
    fetchClassificationMode();
  }, []);

  const fetchRainfallData = async (view: 'daily' | 'monthly', value: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        [view === 'daily' ? 'date' : 'month']: value,
      });

      const response = await fetch(`/api/rainfall-data?${params}`);
      const result = await response.json();

      if (response.ok) {
        setRainfallData(result.data || []);
        if (result.data.length === 0) {
          toast.error('No data available for the selected period');
        }
      } else {
        toast.error(result.error || 'Failed to fetch rainfall data');
        setRainfallData([]);
      }
    } catch (error: any) {
      console.error('Error fetching rainfall data:', error);
      toast.error('Failed to load rainfall data');
      setRainfallData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (mode: 'daily' | 'monthly') => {
    setViewMode(mode);
    setRainfallData([]);
  };

  const handleClassificationModeChange = async (mode: 'dual' | 'multi') => {
    if (mode === classificationMode) return;
    
    setIsSwitchingMode(true);
    try {
      const response = await fetch('/api/rainfall-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const result = await response.json();

      if (response.ok) {
        setClassificationMode(mode);
        toast.success(`Switched to ${mode === 'dual' ? 'Dual' : 'Multi'} classification mode`);
        
        // Refresh data to apply new classification
        if (viewMode === 'daily' && selectedDate) {
          fetchRainfallData('daily', selectedDate);
        } else if (viewMode === 'monthly' && selectedMonth) {
          fetchRainfallData('monthly', selectedMonth);
        }
      } else {
        toast.error(result.error || 'Failed to switch classification mode');
      }
    } catch (error: any) {
      console.error('Error switching classification mode:', error);
      toast.error('Failed to switch classification mode');
    } finally {
      setIsSwitchingMode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Analysis</h2>
        <p className="text-gray-600">
          Visualize district-wise rainfall intensity on an interactive map
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          {/* View Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="daily"
                  checked={viewMode === 'daily'}
                  onChange={() => handleViewModeChange('daily')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Daily View</strong> - Rainfall for a specific day
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  value="monthly"
                  checked={viewMode === 'monthly'}
                  onChange={() => handleViewModeChange('monthly')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Monthly View</strong> - Maximum rainfall in a month
                </span>
              </label>
            </div>
          </div>

          {/* Classification Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classification Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="classificationMode"
                  value="dual"
                  checked={classificationMode === 'dual'}
                  onChange={() => handleClassificationModeChange('dual')}
                  disabled={isSwitchingMode}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Dual Mode</strong> - Binary classification (L/H)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="classificationMode"
                  value="multi"
                  checked={classificationMode === 'multi'}
                  onChange={() => handleClassificationModeChange('multi')}
                  disabled={isSwitchingMode}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Multi Mode</strong> - Advanced classification (L/H/VH/XH)
                </span>
              </label>
            </div>
            {isSwitchingMode && (
              <p className="text-xs text-blue-600 mt-2">Switching mode...</p>
            )}
          </div>

          {/* Date/Month Picker */}
          <div>
            {viewMode === 'daily' ? (
              <div>
                <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="month-picker" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  id="month-picker"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {viewMode === 'daily' ? (
                <>
                  <strong>Daily View:</strong> Shows rainfall recorded on the selected date across all districts.
                </>
              ) : (
                <>
                  <strong>Monthly View:</strong> Shows the maximum rainfall recorded in any single day during the selected month for each district.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rainfall data...</p>
            </div>
          </div>
        ) : (
          <MapVisualization 
            rainfallData={rainfallData} 
            viewMode={viewMode}
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rainfall Classification Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {RAINFALL_CATEGORIES.map((category) => (
            <div key={category.name} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: category.color }}
              ></div>
              <div>
                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                <div className="text-xs text-gray-600">
                  {category.max === null
                    ? `> ${category.min} mm`
                    : category.min === category.max
                    ? `${category.min} mm`
                    : `${category.min}-${category.max} mm`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {rainfallData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Districts</div>
              <div className="text-2xl font-bold text-gray-900">{rainfallData.length}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600">Maximum Rainfall</div>
              <div className="text-2xl font-bold text-blue-900">
                {Math.max(...rainfallData.map(d => d.rainfall)).toFixed(1)} mm
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600">Average Rainfall</div>
              <div className="text-2xl font-bold text-green-900">
                {(rainfallData.reduce((sum, d) => sum + d.rainfall, 0) / rainfallData.length).toFixed(1)} mm
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600">Minimum Rainfall</div>
              <div className="text-2xl font-bold text-orange-900">
                {Math.min(...rainfallData.map(d => d.rainfall)).toFixed(1)} mm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
