'use client';

import React, { useState } from 'react';
import { RangeSlider } from '@/components/ui/Slider';
import { Clock, Droplets, Thermometer, Leaf, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalData {
  rainfall:    number;
  carbon:      number;
  tempAnomaly: number;
}

function getHistoricalContext(yr: number): HistoricalData {
  if (yr < 1985) return { rainfall: 1420, carbon: 0.78, tempAnomaly: -0.2 };
  if (yr < 2000) return { rainfall: 1380, carbon: 0.65, tempAnomaly:  0.1 };
  if (yr < 2015) return { rainfall: 1310, carbon: 0.52, tempAnomaly:  0.4 };
  return              { rainfall: 1250, carbon: 0.44, tempAnomaly:  0.8 };
}

// Trend indicator helper
function Trend({ current, baseline }: { current: number; baseline: number }) {
  const diff = current - baseline;
  if (Math.abs(diff) < 0.05) return null;
  return (
    <span className={cn('text-xs font-semibold ml-2', diff < 0 ? 'text-rose-500' : 'text-emerald-500')}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}
    </span>
  );
}

export function TimeMachine() {
  const [year, setYear] = useState(2010);
  const historical      = getHistoricalContext(year);
  const baseline2024    = getHistoricalContext(2024);

  // Era label
  const era =
    year < 1985 ? 'Pre-Green Revolution Era'  :
    year < 2000 ? 'Post-Green Revolution'      :
    year < 2015 ? 'Climate Stress Era'         : 'Modern Climate Crisis';

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
          <Clock className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="font-bold text-3xl text-slate-800 tracking-tight">Time Machine</h1>
          <p className="text-slate-500 text-sm mt-0.5">Historical environmental baselines for your region</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">

        {/* Era badge */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-xl text-gray-800">Historical Baseline</h2>
            <p className="text-gray-500 text-sm mt-1">Environmental data from <span className="font-bold text-indigo-600">{year}</span></p>
          </div>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
            {era}
          </span>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
            <span>1975</span>
            <span>1990</span>
            <span>2005</span>
            <span>2026</span>
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
          {/* Era markers */}
          <div className="flex justify-between px-1 mt-1">
            {[
              { yr: 1975, label: 'Pre-GR' },
              { yr: 1985, label: 'Post-GR' },
              { yr: 2000, label: 'Stress' },
              { yr: 2015, label: 'Crisis' },
            ].map(({ yr, label }) => (
              <button
                key={yr}
                onClick={() => setYear(yr)}
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all',
                  year >= yr && (yr === 2015 ? true : year < (yr === 1975 ? 1985 : yr === 1985 ? 2000 : yr === 2000 ? 2015 : 2026))
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Rainfall */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 bg-sky-100 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6 text-sky-600" />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Annual Rainfall</p>
            <p className="font-bold text-4xl text-gray-900">
              {historical.rainfall}
              <span className="text-lg text-gray-500 font-medium ml-1">mm</span>
            </p>
            <div className="mt-2 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 mr-1" />
              <span className="text-xs text-slate-400">
                {(((historical.rainfall - baseline2024.rainfall) / baseline2024.rainfall) * 100).toFixed(1)}% vs 2024
              </span>
            </div>
          </div>

          {/* Organic Carbon */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Organic Carbon</p>
            <p className="font-bold text-4xl text-gray-900">
              {historical.carbon}
              <span className="text-lg text-gray-500 font-medium ml-1">%</span>
            </p>
            <div className="mt-2">
              <Trend current={historical.carbon} baseline={baseline2024.carbon} />
              <span className="text-xs text-slate-400">vs 2024</span>
            </div>
          </div>

          {/* Temp Anomaly */}
          <div className={cn(
            'rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border',
            historical.tempAnomaly > 0 ? 'bg-rose-50/60 border-rose-100' : 'bg-blue-50/60 border-blue-100'
          )}>
            <div className={cn(
              'w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center',
              historical.tempAnomaly > 0 ? 'bg-rose-100' : 'bg-blue-100'
            )}>
              <Thermometer className={cn('w-6 h-6', historical.tempAnomaly > 0 ? 'text-rose-600' : 'text-blue-600')} />
            </div>
            <p className="font-medium text-gray-500 text-sm mb-1">Temp Anomaly</p>
            <p className={cn('font-bold text-4xl', historical.tempAnomaly > 0 ? 'text-rose-700' : 'text-blue-700')}>
              {historical.tempAnomaly > 0 ? '+' : ''}{historical.tempAnomaly}
              <span className="text-lg font-medium ml-1 opacity-70">°C</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">from pre-industrial avg</p>
          </div>
        </div>

        {/* Timeline context note */}
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
          <Clock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-700">
            {year < 1985
              ? `In ${year}, soils were richer and rainfall was more predictable. Monsoon patterns were stable with minimal climate variability.`
              : year < 2000
              ? `Around ${year}, the Green Revolution had improved yields but began taxing soil organic carbon through intensive farming practices.`
              : year < 2015
              ? `By ${year}, climate stress was becoming measurable — rainfall started declining and temperature anomalies were rising above pre-industrial levels.`
              : `In ${year}, the climate crisis is clearly visible in data — rainfall down ~${1420 - historical.rainfall}mm from 1975 levels, carbon depleted by ${(0.78 - historical.carbon).toFixed(2)}%.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
