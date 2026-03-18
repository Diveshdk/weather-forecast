'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRainfallColor, getRainfallCategory, normalizeDistrictName, findDistrictColumn } from '@/app/utils/rainfallColors';

interface DistrictRainfall {
  district: string;
  rainfall: number;
}

interface MapVisualizationProps {
  rainfallData: DistrictRainfall[];
  viewMode: 'daily' | 'monthly';
  selectedDate: string;
  selectedMonth: string;
}

// Component to fit bounds when data changes
function FitBounds({ geoJsonData }: { geoJsonData: any }) {
  const map = useMap();

  useEffect(() => {
    if (geoJsonData) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geoJsonData, map]);

  return null;
}

export default function MapVisualization({
  rainfallData,
  viewMode,
  selectedDate,
  selectedMonth,
}: MapVisualizationProps) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load GeoJSON files
  useEffect(() => {
    const loadGeoJson = async () => {
      setIsLoading(true);
      try {
        const [maharashtraResponse, goaResponse] = await Promise.all([
          fetch('/geojson/MAHARASHTRA_DISTRICTS.geojson'),
          fetch('/geojson/GOA_DISTRICTS.geojson'),
        ]);

        const maharashtraData = await maharashtraResponse.json();
        const goaData = await goaResponse.json();

        // Handle Goa district name mapping
        if (goaData.features) {
          goaData.features.forEach((feature: any) => {
            const distCol = findDistrictColumn(feature.properties);
            if (distCol && feature.properties[distCol]) {
              const distName = feature.properties[distCol].toString().trim().toUpperCase();
              // Map NORTH GOA to GOA to match rainfall data
              if (distName === 'NORTH GOA') {
                feature.properties['DISTRICT_NORM'] = 'GOA';
              } else {
                feature.properties['DISTRICT_NORM'] = normalizeDistrictName(distName);
              }
            }
          });
        }

        // Normalize Maharashtra district names
        if (maharashtraData.features) {
          maharashtraData.features.forEach((feature: any) => {
            const distCol = findDistrictColumn(feature.properties);
            if (distCol && feature.properties[distCol]) {
              const distName = feature.properties[distCol].toString();
              feature.properties['DISTRICT_NORM'] = normalizeDistrictName(distName);
            }
          });
        }

        // Combine both GeoJSON datasets
        const combined = {
          type: 'FeatureCollection',
          features: [
            ...(maharashtraData.features || []),
            ...(goaData.features || []),
          ],
        };

        setGeoJsonData(combined);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoJson();
  }, []);

  // Create a map of district -> rainfall
  const rainfallMap = new Map<string, number>();
  rainfallData.forEach((item) => {
    rainfallMap.set(item.district, item.rainfall);
  });

  // Style function for GeoJSON
  const style = (feature: any) => {
    const districtNorm = feature.properties.DISTRICT_NORM;
    const rainfall = rainfallMap.get(districtNorm) || 0;
    const color = getRainfallColor(rainfall);

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#333',
      fillOpacity: 0.7,
    };
  };

  // Highlight style on hover
  const highlightStyle = {
    weight: 3,
    color: '#000',
    fillOpacity: 0.9,
  };

  // Event handlers
  const onEachFeature = (feature: any, layer: any) => {
    const distCol = findDistrictColumn(feature.properties);
    const districtName = distCol ? feature.properties[distCol] : 'Unknown';
    const districtNorm = feature.properties.DISTRICT_NORM;
    const rainfall = rainfallMap.get(districtNorm) || 0;
    const category = getRainfallCategory(rainfall);

    // Tooltip
    layer.bindTooltip(
      `<div style="font-family: sans-serif;">
        <strong>${districtName}</strong><br/>
        Rainfall: <strong>${rainfall.toFixed(1)} mm</strong><br/>
        Category: <em>${category}</em>
      </div>`,
      {
        sticky: false,
        direction: 'top',
      }
    );

    // Hover effects
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle(highlightStyle);
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (!geoJsonData) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded-lg">
        <p className="text-gray-600">Failed to load map data</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={[19.7515, 75.7139]}
        zoom={7}
        style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={JSON.stringify(rainfallData)}
          data={geoJsonData}
          style={style}
          onEachFeature={onEachFeature}
        />
        <FitBounds geoJsonData={geoJsonData} />
      </MapContainer>

      {/* Map Title Overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <h3 className="text-lg font-bold text-gray-900">
          {viewMode === 'daily' 
            ? `Rainfall on ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : `Maximum Rainfall in ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
          }
        </h3>
      </div>
    </div>
  );
}
