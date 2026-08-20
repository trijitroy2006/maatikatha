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
    <div className="w-full h-full flex items-center justify-center bg-[#FFFDE7] border-4 border-black">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-black mx-auto mb-3" />
        <p className="font-black text-black text-lg">LOADING 3D MODEL...</p>
      </div>
    </div>
  );
}

const ACTIONS_CONFIG = [
  { id: 'irrigation',      label: 'IRRIGATION',       emoji: '💧', effect: { water: +20, compost: 0,  pest: -5  } },
  { id: 'compost',         label: 'COMPOST',          emoji: '🌱', effect: { water: +5,  compost: +25, pest: -5  } },
  { id: 'biospray',        label: 'BIO-SPRAY',        emoji: '🧪', effect: { water: 0,   compost: 0,  pest: -30 } },
  { id: 'miss_irrigation', label: 'SKIP IRRIGATION',  emoji: '❌', effect: { water: -25, compost: 0,  pest: +10 } },
  { id: 'harvest',         label: 'HARVEST',          emoji: '🌾', effect: { water: 0,   compost: 0,  pest: 0   } },
];

const RISK_STYLES: Record<string, string> = {
  low:      'bg-[#1B5E20] text-white',
  medium:   'bg-[#FFD600] text-black',
  high:     'bg-orange-500 text-white',
  critical: 'bg-[#D50000] text-white',
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
        <div className="p-3 bg-[#FFD600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Zap className="w-8 h-8 text-black" />
        </div>
        <h2 className="font-black text-3xl text-black tracking-tight">WHAT-IF CROP SIMULATOR</h2>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* LEFT — Controls */}
        <div className="space-y-5">
          {/* Year Slider */}
          <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-5">
            <h3 className="font-black text-xl text-black uppercase tracking-wide border-b-4 border-black pb-3">
              🕰️ TIME MACHINE ({year})
            </h3>
            <RangeSlider
              min={1975} max={2026} value={year} onChange={setYear}
              step={1} trackColor="bg-[#FFD600]" valueDisplay={String(year)}
            />
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: 'Rainfall',  value: `${historical.rainfall}`, unit: 'mm',     highlight: false },
                { label: 'Carbon',    value: `${historical.carbon}`,   unit: '%',      highlight: false },
                { label: 'Temp Δ',    value: `${historical.tempAnomaly > 0 ? '+' : ''}${historical.tempAnomaly}°C`, unit: '',
                  highlight: historical.tempAnomaly > 0 },
              ].map(({ label, value, unit, highlight }) => (
                <div key={label} className={cn(
                  'border-4 border-black p-3 text-center',
                  highlight ? 'bg-[#D50000] text-white' : 'bg-white text-black'
                )}>
                  <p className="text-xs font-bold uppercase">{label}</p>
                  <p className="font-black text-xl mt-1">{value}<span className="text-sm font-bold ml-0.5">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Day Slider */}
          <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-5">
            <h3 className="font-black text-xl text-black uppercase tracking-wide border-b-4 border-black pb-3">
              🌱 GROWING DAY
            </h3>
            <RangeSlider
              min={1} max={90} value={day} onChange={setDay}
              step={1} trackColor="bg-[#1B5E20]" valueDisplay={`Day ${day}`}
            />
          </div>

          {/* Action Toggles */}
          <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
            <h3 className="font-black text-xl text-black uppercase tracking-wide border-b-4 border-black pb-3 mb-4">
              ⚡ FARM ACTIONS
            </h3>
            <div className="flex flex-wrap gap-3">
              {ACTIONS_CONFIG.map(({ id, label, emoji }) => (
                <button key={id} onClick={() => toggleAction(id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 border-4 border-black font-black text-sm transition-all duration-100',
                    selectedActions.includes(id)
                      ? 'bg-[#FFD600] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-0 translate-y-0'
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD600]'
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* 3D state indicators */}
            <div className="flex gap-3 mt-4 text-sm font-bold">
              <span className={cn('px-3 py-1 border-2 border-black font-bold',
                waterLevel > 60 ? 'bg-[#1B5E20] text-white' : waterLevel > 35 ? 'bg-[#FFD600] text-black' : 'bg-[#D50000] text-white')}>
                💧 Water: {waterLevel}%
              </span>
              <span className="bg-white border-2 border-black px-3 py-1 text-black">
                🌿 Compost: {compostLevel}%
              </span>
              <span className={cn('px-3 py-1 border-2 border-black',
                pestDamage < 30 ? 'bg-[#1B5E20] text-white' : pestDamage < 60 ? 'bg-[#FFD600] text-black' : 'bg-[#D50000] text-white')}>
                🐛 Pest: {Math.round(pestDamage)}%
              </span>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={() => simulate({ year, day, actions: selectedActions })}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-5 bg-[#FFD600] border-4 border-black
              shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xl text-black transition-all duration-100
              hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              disabled:opacity-60 disabled:cursor-not-allowed min-h-[64px]"
          >
            {isLoading
              ? <><Loader2 className="w-7 h-7 animate-spin" /><span>SIMULATING...</span></>
              : <><Wheat   className="w-7 h-7" /><span>RUN SIMULATION →</span></>
            }
          </button>
        </div>

        {/* RIGHT — 3D Crop Model */}
        <div className="flex flex-col gap-5">
          <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-black text-[#FFD600] px-5 py-3 font-black text-sm uppercase tracking-wider flex items-center justify-between">
              <span>🌱 3D CROP PREVIEW — DRAG TO ROTATE</span>
              <span className="text-xs opacity-70">WebGL</span>
            </div>
            <div className="h-[420px]">
              <Suspense fallback={<CanvasPlaceholder />}>
                <CropModel
                  waterLevel={waterLevel}
                  compostLevel={compostLevel}
                  pestDamage={pestDamage}
                />
              </Suspense>
            </div>
            <div className="bg-black text-white px-5 py-2 text-xs font-bold flex gap-4">
              <span className="text-[#FFD600]">● HEALTHY</span>
              <span className="text-orange-400">● DROUGHT</span>
              <span className="text-red-400">● PEST DAMAGE</span>
              <span className="text-purple-300">● FLOWERING</span>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-5 animate-in">
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <span className="font-black text-xl text-black">SIMULATION RESULTS</span>
                <span className={cn('px-4 py-2 border-4 border-black font-black text-sm', RISK_STYLES[result.risk_level])}>
                  {result.risk_level.toUpperCase()} RISK
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ResultCard icon={<Wheat       className="w-6 h-6 text-black" />} label="Yield"    value={`${Math.round(result.yield_kg_per_hectare)}`} unit="kg/ha" bg="bg-[#FFD600]" />
                <ResultCard icon={<Droplets    className="w-6 h-6 text-black" />} label="Moisture" value={`${result.soil_moisture_pct.toFixed(1)}`}       unit="%"     bg="bg-white"    />
                <ResultCard icon={<Thermometer className="w-6 h-6 text-black" />} label="Temp Δ"  value={`${result.temperature_anomaly > 0 ? '+' : ''}${result.temperature_anomaly.toFixed(2)}`} unit="°C" bg="bg-white" />
                <ResultCard icon={<Droplets    className="w-6 h-6 text-black" />} label="Rainfall" value={`${result.rainfall_mm.toFixed(1)}`}             unit="mm"    bg="bg-[#FFD600]" />
              </div>
              {result.message && (
                <div className="flex items-start gap-3 p-4 border-4 border-black bg-[#FFD600]">
                  <AlertTriangle className="w-6 h-6 text-black mt-0.5 shrink-0" />
                  <p className="text-base font-bold text-black">{result.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultCard({ icon, label, value, unit, bg }: {
  icon: React.ReactNode; label: string; value: string; unit: string; bg: string;
}) {
  return (
    <div className={cn('border-4 border-black p-4', bg)}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-black text-black uppercase">{label}</span></div>
      <div className="flex items-baseline gap-1">
        <span className="font-black text-3xl text-black">{value}</span>
        <span className="text-sm font-bold text-black">{unit}</span>
      </div>
    </div>
  );
}
