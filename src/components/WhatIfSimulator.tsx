'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { RangeSlider } from '@/components/ui/Slider';
import { useSimulator } from '@/hooks/useSimulator';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Wheat, Droplets, Thermometer, AlertTriangle } from 'lucide-react';

// Dynamic import to avoid SSR issues with WebGL
const CropModel = dynamic(
  () => import('@/components/CropModel').then((m) => ({ default: m.CropModel })),
  { ssr: false, loading: () => <CanvasPlaceholder /> }
);

function CanvasPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="font-semibold text-gray-500 text-lg">Loading 3D Model...</p>
      </div>
    </div>
  );
}

const ACTIONS_CONFIG = [
  { id: 'irrigation',      label: 'Irrigation',       emoji: '💧', effect: { water: +20, compost: 0,  pest: -5  } },
  { id: 'compost',         label: 'Compost',          emoji: '🌱', effect: { water: +5,  compost: +25, pest: -5  } },
  { id: 'biospray',        label: 'Bio-Spray',        emoji: '🧪', effect: { water: 0,   compost: 0,  pest: -30 } },
  { id: 'miss_irrigation', label: 'Skip Irrigation',  emoji: '❌', effect: { water: -25, compost: 0,  pest: +10 } },
  { id: 'harvest',         label: 'Harvest',          emoji: '🌾', effect: { water: 0,   compost: 0,  pest: 0   } },
];

const RISK_STYLES: Record<string, string> = {
  low:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium:   'bg-amber-100 text-amber-800 border-amber-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function WhatIfSimulator() {
  const { result, isLoading, simulate } = useSimulator();
  const [year, setYear]   = useState(2010);
  const [day,  setDay]    = useState(45);
  const [selectedActions, setSelectedActions] = useState<string[]>(['irrigation']);

  // Derive 3D model state from slider values and actions
  const waterLevel = Math.max(5, Math.min(100,
    50 +
    selectedActions.reduce((acc, id) => {
      const a = ACTIONS_CONFIG.find((c) => c.id === id);
      return acc + (a?.effect.water ?? 0);
    }, 0)
  ));
  const compostLevel = Math.max(0, Math.min(100,
    30 +
    selectedActions.reduce((acc, id) => {
      const a = ACTIONS_CONFIG.find((c) => c.id === id);
      return acc + (a?.effect.compost ?? 0);
    }, 0)
  ));
  const pestDamage = Math.max(0, Math.min(100,
    20 + (year > 2010 ? (year - 2010) * 1.5 : 0) +
    selectedActions.reduce((acc, id) => {
      const a = ACTIONS_CONFIG.find((c) => c.id === id);
      return acc + (a?.effect.pest ?? 0);
    }, 0)
  ));

  const toggleAction = (id: string) =>
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );

  const getHistoricalContext = (yr: number) => {
    if (yr < 1985) return { rainfall: 1420, carbon: 0.78, tempAnomaly: -0.2 };
    if (yr < 2000) return { rainfall: 1380, carbon: 0.65, tempAnomaly:  0.1 };
    if (yr < 2015) return { rainfall: 1310, carbon: 0.52, tempAnomaly:  0.4 };
    return              { rainfall: 1250, carbon: 0.44, tempAnomaly:  0.8 };
  };
  const historical = getHistoricalContext(year);

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <Zap className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="font-bold text-2xl text-gray-900 tracking-tight">What-If Crop Simulator</h2>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* LEFT — Controls */}
        <div className="space-y-5">
          {/* Year Slider */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h3 className="font-semibold text-gray-700 uppercase text-sm tracking-wider flex items-center gap-2">
              <span>🕰️</span> Time Machine ({year})
            </h3>
            <RangeSlider
              min={1975} max={2026} value={year} onChange={setYear}
              step={1} trackColor="bg-emerald-500" valueDisplay={String(year)}
            />
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { label: 'Rainfall',  value: `${historical.rainfall}`, unit: 'mm',     highlight: false },
                { label: 'Carbon',    value: `${historical.carbon}`,   unit: '%',      highlight: false },
                { label: 'Temp Δ',    value: `${historical.tempAnomaly > 0 ? '+' : ''}${historical.tempAnomaly}°C`, unit: '',
                  highlight: historical.tempAnomaly > 0 },
              ].map(({ label, value, unit, highlight }) => (
                <div key={label} className={cn(
                  'rounded-xl p-4 text-center border border-gray-50 transition-colors',
                  highlight ? 'bg-red-50 text-red-900' : 'bg-gray-50 text-gray-900'
                )}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-lg mt-1">{value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Day Slider */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h3 className="font-semibold text-gray-700 uppercase text-sm tracking-wider flex items-center gap-2">
              <span>🌱</span> Growing Day
            </h3>
            <RangeSlider
              min={1} max={90} value={day} onChange={setDay}
              step={1} trackColor="bg-emerald-500" valueDisplay={`Day ${day}`}
            />
          </div>

          {/* Action Toggles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 uppercase text-sm tracking-wider flex items-center gap-2 mb-4">
              <span>⚡</span> Farm Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              {ACTIONS_CONFIG.map(({ id, label, emoji }) => (
                <button key={id} onClick={() => toggleAction(id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                    selectedActions.includes(id)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* 3D state indicators */}
            <div className="flex gap-3 mt-6 text-xs font-medium">
              <span className={cn('px-3 py-1.5 rounded-lg flex items-center gap-1.5',
                waterLevel > 60 ? 'bg-emerald-100 text-emerald-800' : waterLevel > 35 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}>
                <span>💧</span> Water: {waterLevel}%
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span>🌿</span> Compost: {compostLevel}%
              </span>
              <span className={cn('px-3 py-1.5 rounded-lg flex items-center gap-1.5',
                pestDamage < 30 ? 'bg-emerald-100 text-emerald-800' : pestDamage < 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}>
                <span>🐛</span> Pest: {Math.round(pestDamage)}%
              </span>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={() => simulate({ year, day, actions: selectedActions })}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 rounded-xl shadow-md text-white font-semibold text-lg transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-6 h-6 animate-spin" /><span>Simulating...</span></>
              : <><Wheat   className="w-6 h-6" /><span>Run Simulation</span></>
            }
          </button>
        </div>

        {/* RIGHT — 3D Crop Model */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2"><span>🌱</span> 3D Crop Preview</span>
              <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-md border border-gray-100">Drag to rotate</span>
            </div>
            <div className="h-[420px] bg-gray-50/50">
              <Suspense fallback={<CanvasPlaceholder />}>
                <CropModel
                  waterLevel={waterLevel}
                  compostLevel={compostLevel}
                  pestDamage={pestDamage}
                />
              </Suspense>
            </div>
            <div className="bg-white border-t border-gray-100 px-5 py-3 text-xs font-medium flex gap-5">
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="text-[10px]">●</span> Healthy</span>
              <span className="flex items-center gap-1.5 text-amber-500"><span className="text-[10px]">●</span> Drought</span>
              <span className="flex items-center gap-1.5 text-red-500"><span className="text-[10px]">●</span> Pest Damage</span>
              <span className="flex items-center gap-1.5 text-purple-500"><span className="text-[10px]">●</span> Flowering</span>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="font-bold text-xl text-gray-900">Simulation Results</span>
                <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border', RISK_STYLES[result.risk_level])}>
                  {result.risk_level} Risk
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ResultCard icon={<Wheat       className="w-5 h-5 text-emerald-600" />} label="Yield"    value={`${Math.round(result.yield_kg_per_hectare)}`} unit="kg/ha" />
                <ResultCard icon={<Droplets    className="w-5 h-5 text-blue-500" />} label="Moisture" value={`${result.soil_moisture_pct.toFixed(1)}`}       unit="%" />
                <ResultCard icon={<Thermometer className="w-5 h-5 text-amber-500" />} label="Temp Δ"  value={`${result.temperature_anomaly > 0 ? '+' : ''}${result.temperature_anomaly.toFixed(2)}`} unit="°C" />
                <ResultCard icon={<Droplets    className="w-5 h-5 text-cyan-500" />} label="Rainfall" value={`${result.rainfall_mm.toFixed(1)}`}             unit="mm" />
              </div>
              {result.message && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-amber-800">{result.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultCard({ icon, label, value, unit }: {
  icon: React.ReactNode; label: string; value: string; unit: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors hover:bg-gray-100/50">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span></div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-bold text-2xl text-gray-900">{value}</span>
        <span className="text-sm font-medium text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
