'use client';

import React, { useState, useEffect } from 'react';
import { RangeSlider } from '@/components/ui/Slider';
import { useSimulator } from '@/hooks/useSimulator';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import {
  Thermometer,
  Droplets,
  Wheat,
  AlertTriangle,
  Loader2,
  Zap,
} from 'lucide-react';

const ACTIONS_CONFIG = [
  { id: 'irrigation', labelKey: 'sim_action_irrigation' as const, emoji: '💧' },
  { id: 'compost', labelKey: 'sim_action_compost' as const, emoji: '🌱' },
  { id: 'biospray', labelKey: 'sim_action_biospray' as const, emoji: '🧪' },
  { id: 'miss_irrigation', labelKey: 'sim_action_miss_irrig' as const, emoji: '❌' },
  { id: 'harvest', labelKey: 'sim_action_harvest' as const, emoji: '🌾' },
];

const RISK_STYLES = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500',
  critical: 'bg-red-500/20 text-red-300 border-red-500',
};

export function SimulatorPanel() {
  const { t } = useI18n();
  const { result, isLoading, simulate } = useSimulator();

  const [year, setYear] = useState(2010);
  const [day, setDay] = useState(45);
  const [selectedActions, setSelectedActions] = useState<string[]>(['irrigation']);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSimulate = () => {
    simulate({ year, day, actions: selectedActions });
  };

  // Historical context based on year
  const getHistoricalContext = (yr: number) => {
    if (yr < 1985) return { rainfall: 1420, carbon: 0.78, tempAnomaly: -0.2 };
    if (yr < 2000) return { rainfall: 1380, carbon: 0.65, tempAnomaly: 0.1 };
    if (yr < 2015) return { rainfall: 1310, carbon: 0.52, tempAnomaly: 0.4 };
    return { rainfall: 1250, carbon: 0.44, tempAnomaly: 0.8 };
  };

  const historical = getHistoricalContext(year);

  return (
    <section className="w-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500 rounded-xl">
          <Zap className="w-6 h-6 text-stone-900" />
        </div>
        <h2 className="text-2xl font-bold text-amber-400 font-bengali">
          {t.sim_title}
        </h2>
      </div>

      {/* ---- Time Machine Slider ---- */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-stone-300 uppercase tracking-wide">
          🕰️ {t.sim_year_label}
        </h3>
        <RangeSlider
          min={1975}
          max={2026}
          value={year}
          onChange={setYear}
          step={1}
          trackColor="bg-amber-500"
          valueDisplay={String(year)}
        />

        {/* Historical baseline pills */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-stone-700 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-400 font-bengali">{t.sim_rainfall_label}</p>
            <p className="text-lg font-bold text-sky-300">{historical.rainfall}</p>
            <p className="text-xs text-stone-500">mm</p>
          </div>
          <div className="bg-stone-700 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-400 font-bengali">{t.sim_carbon_label}</p>
            <p className="text-lg font-bold text-emerald-300">{historical.carbon}</p>
            <p className="text-xs text-stone-500">%</p>
          </div>
          <div className="bg-stone-700 rounded-xl p-3 text-center">
            <p className="text-xs text-stone-400 font-bengali">{t.sim_temp_label}</p>
            <p className={cn('text-lg font-bold', historical.tempAnomaly > 0 ? 'text-red-300' : 'text-blue-300')}>
              {historical.tempAnomaly > 0 ? '+' : ''}{historical.tempAnomaly}°C
            </p>
            <p className="text-xs text-stone-500">vs 1975</p>
          </div>
        </div>
      </div>

      {/* ---- What-If Day Slider ---- */}
      <div className="bg-stone-800/80 border border-stone-600 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-semibold text-stone-300 uppercase tracking-wide">
          🌱 {t.sim_day_label}
        </h3>
        <RangeSlider
          min={1}
          max={90}
          value={day}
          onChange={setDay}
          step={1}
          trackColor="bg-emerald-500"
          valueDisplay={`${day} ${t.days}`}
        />

        {/* Action Toggles */}
        <div>
          <p className="text-sm font-semibold text-stone-300 mb-2 font-bengali">
            {t.sim_actions_label}
          </p>
          <div className="flex flex-wrap gap-2">
            {ACTIONS_CONFIG.map(({ id, labelKey, emoji }) => (
              <button
                key={id}
                onClick={() => toggleAction(id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all active:scale-95 font-bengali',
                  selectedActions.includes(id)
                    ? 'bg-emerald-500 border-emerald-400 text-stone-900'
                    : 'bg-stone-700 border-stone-600 text-stone-200 hover:border-emerald-500'
                )}
              >
                <span>{emoji}</span>
                {t[labelKey]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Run Button ---- */}
      <button
        onClick={handleSimulate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 font-bold text-lg rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-amber-500/30"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-bengali">{t.loading}</span>
          </>
        ) : (
          <>
            <Wheat className="w-6 h-6" />
            <span className="font-bengali">{t.sim_run_btn}</span>
          </>
        )}
      </button>

      {/* ---- Results Panel ---- */}
      {result && (
        <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Risk Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-400 font-bengali">{t.sim_risk_label}</span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-bold border',
                RISK_STYLES[result.risk_level]
              )}
            >
              {result.risk_level.toUpperCase()}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Wheat className="w-5 h-5 text-amber-400" />}
              label={t.sim_yield_label}
              value={`${Math.round(result.yield_kg_per_hectare)}`}
              unit="kg/ha"
              color="amber"
            />
            <MetricCard
              icon={<Droplets className="w-5 h-5 text-sky-400" />}
              label={t.sim_moisture_label}
              value={`${result.soil_moisture_pct.toFixed(1)}`}
              unit="%"
              color="sky"
            />
            <MetricCard
              icon={<Thermometer className="w-5 h-5 text-red-400" />}
              label={t.sim_temp_label}
              value={`${result.temperature_anomaly > 0 ? '+' : ''}${result.temperature_anomaly.toFixed(2)}`}
              unit="°C"
              color="red"
            />
            <MetricCard
              icon={<Droplets className="w-5 h-5 text-blue-400" />}
              label={t.sim_rainfall_label}
              value={`${result.rainfall_mm.toFixed(1)}`}
              unit="mm"
              color="blue"
            />
          </div>

          {/* Message */}
          {result.message && (
            <div className="flex items-start gap-2 p-3 bg-stone-700/50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-stone-200">{result.message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---- Metric Card ----
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'amber' | 'sky' | 'red' | 'blue' | 'emerald';
}

const COLOR_MAP = {
  amber: 'text-amber-300',
  sky: 'text-sky-300',
  red: 'text-red-300',
  blue: 'text-blue-300',
  emerald: 'text-emerald-300',
};

function MetricCard({ icon, label, value, unit, color }: MetricCardProps) {
  return (
    <div className="bg-stone-700/60 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-stone-400 font-bengali leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-2xl font-bold', COLOR_MAP[color])}>{value}</span>
        <span className="text-xs text-stone-400">{unit}</span>
      </div>
    </div>
  );
}
