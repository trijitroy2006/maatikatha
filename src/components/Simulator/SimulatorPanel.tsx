'use client';

import React, { useState } from 'react';
import { RangeSlider } from '@/components/ui/Slider';
import { useSimulator } from '@/hooks/useSimulator';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import {
  Thermometer, Droplets, Wheat, AlertTriangle, Loader2, Zap,
} from 'lucide-react';

const ACTIONS_CONFIG = [
  { id: 'irrigation',      label: 'Irrigation',        emoji: '💧' },
  { id: 'compost',         label: 'Compost Addition',  emoji: '🌱' },
  { id: 'biospray',        label: 'Bio-spray',         emoji: '🧪' },
  { id: 'miss_irrigation', label: 'Missed Irrigation', emoji: '❌' },
  { id: 'harvest',         label: 'Harvest',           emoji: '🌾' },
];

const RISK_STYLES = {
  low:      'bg-emerald-500/20 text-emerald-300 border-emerald-500',
  medium:   'bg-amber-500/20  text-amber-300  border-amber-500',
  high:     'bg-orange-500/20 text-orange-300 border-orange-500',
  critical: 'bg-red-500/20    text-red-300    border-red-500',
};

export function SimulatorPanel() {
  const { t } = useI18n();
  const { result, isLoading, simulate } = useSimulator();

  const [year, setYear]   = useState(2010);
  const [day,  setDay]    = useState(45);
  const [selectedActions, setSelectedActions] = useState<string[]>(['irrigation']);

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
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500 rounded-2xl">
          <Zap className="w-8 h-8 text-stone-900" />
        </div>
        <h2 className="text-3xl font-bold text-amber-400">{t.sim_title}</h2>
      </div>

      {/* Time Machine Slider */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-2xl p-6 space-y-5">
        <h3 className="text-xl font-semibold text-stone-200 uppercase tracking-wide">
          🕰️ {t.sim_year_label}
        </h3>
        <RangeSlider
          min={1975} max={2026} value={year} onChange={setYear}
          step={1} trackColor="bg-amber-500" valueDisplay={String(year)}
        />

        {/* Historical pills */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Rainfall', value: `${historical.rainfall}`, unit: 'mm',    color: 'text-sky-300' },
            { label: 'Carbon',   value: `${historical.carbon}`,   unit: '%',     color: 'text-emerald-300' },
            { label: 'Temp Δ',   value: `${historical.tempAnomaly > 0 ? '+' : ''}${historical.tempAnomaly}°C`, unit: 'vs 1975', color: historical.tempAnomaly > 0 ? 'text-red-300' : 'text-blue-300' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="bg-stone-700 rounded-2xl p-4 text-center">
              <p className="text-base text-stone-400 mb-1">{label}</p>
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
              <p className="text-sm text-stone-500 mt-1">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Day Slider */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-2xl p-6 space-y-5">
        <h3 className="text-xl font-semibold text-stone-200 uppercase tracking-wide">
          🌱 {t.sim_day_label}
        </h3>
        <RangeSlider
          min={1} max={90} value={day} onChange={setDay}
          step={1} trackColor="bg-emerald-500" valueDisplay={`Day ${day}`}
        />

        {/* Action Toggles */}
        <div>
          <p className="text-lg font-semibold text-stone-200 mb-3">{t.sim_actions_label}</p>
          <div className="flex flex-wrap gap-3">
            {ACTIONS_CONFIG.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => toggleAction(id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-full text-base font-semibold border-2 transition-all active:scale-95',
                  selectedActions.includes(id)
                    ? 'bg-emerald-500 border-emerald-400 text-stone-900'
                    : 'bg-stone-700 border-stone-600 text-stone-200 hover:border-emerald-500'
                )}
              >
                <span className="text-xl">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={() => simulate({ year, day, actions: selectedActions })}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 font-bold text-xl rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-amber-500/30"
      >
        {isLoading
          ? <><Loader2 className="w-7 h-7 animate-spin" /><span>Loading...</span></>
          : <><Wheat   className="w-7 h-7" /><span>{t.sim_run_btn}</span></>
        }
      </button>

      {/* Results */}
      {result && (
        <div className="bg-stone-800 border border-stone-600 rounded-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <span className="text-lg text-stone-400">{t.sim_risk_label}</span>
            <span className={cn('px-4 py-1.5 rounded-full text-base font-bold border', RISK_STYLES[result.risk_level])}>
              {result.risk_level.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard icon={<Wheat       className="w-6 h-6 text-amber-400" />} label={t.sim_yield_label}    value={`${Math.round(result.yield_kg_per_hectare)}`} unit="kg/ha" color="amber" />
            <MetricCard icon={<Droplets    className="w-6 h-6 text-sky-400"   />} label={t.sim_moisture_label} value={`${result.soil_moisture_pct.toFixed(1)}`}       unit="%"     color="sky"   />
            <MetricCard icon={<Thermometer className="w-6 h-6 text-red-400"   />} label={t.sim_temp_label}     value={`${result.temperature_anomaly > 0 ? '+' : ''}${result.temperature_anomaly.toFixed(2)}`} unit="°C" color="red" />
            <MetricCard icon={<Droplets    className="w-6 h-6 text-blue-400"  />} label={t.sim_rainfall_label} value={`${result.rainfall_mm.toFixed(1)}`}             unit="mm"    color="blue"  />
          </div>

          {result.message && (
            <div className="flex items-start gap-3 p-4 bg-stone-700/50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-base text-stone-200">{result.message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

interface MetricCardProps {
  icon: React.ReactNode; label: string; value: string; unit: string;
  color: 'amber' | 'sky' | 'red' | 'blue' | 'emerald';
}
const COLOR_MAP = { amber: 'text-amber-300', sky: 'text-sky-300', red: 'text-red-300', blue: 'text-blue-300', emerald: 'text-emerald-300' };

function MetricCard({ icon, label, value, unit, color }: MetricCardProps) {
  return (
    <div className="bg-stone-700/60 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-stone-400 leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-3xl font-bold', COLOR_MAP[color])}>{value}</span>
        <span className="text-base text-stone-400">{unit}</span>
      </div>
    </div>
  );
}
