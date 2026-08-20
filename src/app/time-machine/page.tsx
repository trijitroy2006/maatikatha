'use client';

import React, { useState } from 'react';
import { RangeSlider } from '@/components/ui/Slider';
import { Clock, Droplets, Thermometer, Leaf } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 animate-in">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-[#FFD600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Clock className="w-8 h-8 text-black" />
        </div>
        <h1 className="font-black text-4xl text-black tracking-tight">TIME MACHINE</h1>
      </div>

      <div className="bg-[#FFFDE7] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 space-y-8">
        <h2 className="font-black text-2xl border-b-4 border-black pb-4">HISTORICAL BASELINE ({year})</h2>
        
        <RangeSlider 
          min={1975} 
          max={2026} 
          value={year} 
          onChange={setYear}
          step={1} 
          trackColor="bg-[#FFD600]" 
          valueDisplay={String(year)} 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Droplets className="w-10 h-10 mx-auto mb-4 text-[#1B5E20]" />
            <p className="font-bold uppercase tracking-wider text-sm mb-2">Annual Rainfall</p>
            <p className="font-black text-4xl">{historical.rainfall}<span className="text-xl ml-1">mm</span></p>
          </div>
          
          <div className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Leaf className="w-10 h-10 mx-auto mb-4 text-[#1B5E20]" />
            <p className="font-bold uppercase tracking-wider text-sm mb-2">Organic Carbon</p>
            <p className="font-black text-4xl">{historical.carbon}<span className="text-xl ml-1">%</span></p>
          </div>
          
          <div className={`border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${historical.tempAnomaly > 0 ? 'bg-[#D50000] text-white' : 'bg-white text-black'}`}>
            <Thermometer className="w-10 h-10 mx-auto mb-4" />
            <p className="font-bold uppercase tracking-wider text-sm mb-2">Temp Anomaly</p>
            <p className="font-black text-4xl">{historical.tempAnomaly > 0 ? '+' : ''}{historical.tempAnomaly}<span className="text-xl ml-1">°C</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
