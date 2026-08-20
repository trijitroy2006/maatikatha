'use client';

import React, { useState } from 'react';
import { RangeSlider } from '@/components/ui/Slider';
import { Clock, Droplets, Thermometer, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimeMachinePage() {
  const [year, setYear] = useState(2010);

  const getHistoricalContext = (yr: number) => {
    if (yr < 1985) return { rainfall: 1420, carbon: 0.78, tempAnomaly: -0.2 };
    if (yr < 2000) return { rainfall: 1380, carbon: 0.65, tempAnomaly:  0.1 };
    if (yr < 2015) return { rainfall: 1310, carbon: 0.52, tempAnomaly:  0.4 };
    return              { rainfall: 1250, carbon: 0.44, tempAnomaly:  0.8 };
  };

  const historical = getHistoricalContext(year);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
          <Clock className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="font-semibold text-3xl text-gray-900 tracking-tight">Time Machine</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-10">
        <div className="space-y-2">
          <h2 className="font-semibold text-xl text-gray-800">Historical Baseline</h2>
          <p className="text-gray-500 text-sm">Explore environmental data from {year}</p>
        </div>
        
        <div className="px-2">
          <RangeSlider 
            min={1975} 
            max={2026} 
            value={year} 
            onChange={setYear}
            step={1} 
            trackColor="bg-indigo-500" 
            valueDisplay={String(year)} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 bg-sky-100 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6 text-sky-600" />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Annual Rainfall</p>
            <p className="font-semibold text-3xl text-gray-900">{historical.rainfall}<span className="text-lg text-gray-500 font-medium ml-1">mm</span></p>
          </div>
          
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Organic Carbon</p>
            <p className="font-semibold text-3xl text-gray-900">{historical.carbon}<span className="text-lg text-gray-500 font-medium ml-1">%</span></p>
          </div>
          
          <div className={cn(
            "rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border",
            historical.tempAnomaly > 0 
              ? "bg-rose-50/50 border-rose-100" 
              : "bg-blue-50/50 border-blue-100"
          )}>
            <div className={cn(
              "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center",
              historical.tempAnomaly > 0 ? "bg-rose-100" : "bg-blue-100"
            )}>
              <Thermometer className={cn("w-6 h-6", historical.tempAnomaly > 0 ? "text-rose-600" : "text-blue-600")} />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Temp Anomaly</p>
            <p className={cn(
              "font-semibold text-3xl",
              historical.tempAnomaly > 0 ? "text-rose-700" : "text-blue-700"
            )}>
              {historical.tempAnomaly > 0 ? '+' : ''}{historical.tempAnomaly}<span className="text-lg font-medium ml-1 opacity-70">°C</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
