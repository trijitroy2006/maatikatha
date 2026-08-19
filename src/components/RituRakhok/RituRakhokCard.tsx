'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClimateData } from '@/lib/api';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { ClimateResponse } from '@/lib/types';
import { CloudRain, Thermometer, Sprout, AlertOctagon, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

const MOCK_CLIMATE: ClimateResponse = {
  baseline_40yr: {
    avg_rainfall_mm: 1380,
    avg_temp_celsius: 27.4,
    organic_carbon_pct: 0.62,
    onset_date: 'June 10',
    cessation_date: 'September 28',
  },
  forecast_14d: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    rainfall_mm: 4 + Math.random() * 18,
    temp_max: 32 + Math.random() * 5,
    temp_min: 24 + Math.random() * 3,
    humidity_pct: 60 + Math.random() * 30,
    condition: ['☀️ Sunny', '⛅ Partly Cloudy', '🌧️ Rainy', '⛈️ Stormy'][Math.floor(Math.random() * 4)],
  })),
  sowing_shift_days: 7,
  recommended_seeds: ['Satabdi Rice', 'CR Dhan 401', 'Ranjit'],
  mulching_action: 'Apply 5 cm straw mulch to retain soil moisture',
  alert_level: 'watch',
};

const ALERT_STYLES = {
  normal:   { bg: 'bg-emerald-900/60 border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500', icon: <CheckCircle2 className="w-6 h-6" /> },
  watch:    { bg: 'bg-amber-900/60   border-amber-500',   text: 'text-amber-300',   badge: 'bg-amber-500',   icon: <AlertOctagon className="w-6 h-6" /> },
  warning:  { bg: 'bg-orange-900/60  border-orange-500',  text: 'text-orange-300',  badge: 'bg-orange-500',  icon: <AlertOctagon className="w-6 h-6" /> },
  critical: { bg: 'bg-red-900/60     border-red-500',     text: 'text-red-300',     badge: 'bg-red-500',     icon: <AlertOctagon className="w-6 h-6 animate-pulse" /> },
};
const ALERT_LABELS = { normal: 'Normal', watch: 'Watch', warning: 'Warning', critical: 'Critical Alert' };

interface RituRakhokCardProps { lat?: number; lon?: number; }

export function RituRakhokCard({ lat = 23.06, lon = 88.46 }: RituRakhokCardProps) {
  const { t } = useI18n();
  const [data, setData]           = useState<ClimateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchClimate = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setData(await getClimateData({ lat, lon })); }
    catch { setError('Demo mode — backend not connected'); setData(MOCK_CLIMATE); }
    finally { setIsLoading(false); }
  }, [lat, lon]);

  useEffect(() => { fetchClimate(); }, [fetchClimate]);

  const alertStyle = ALERT_STYLES[data?.alert_level ?? 'normal'];

  return (
    <section className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500 rounded-2xl">
            <CloudRain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-sky-400">{t.climate_title}</h2>
        </div>
        <button onClick={fetchClimate} disabled={isLoading}
          className="p-3 rounded-full bg-stone-700 hover:bg-stone-600 active:scale-95 transition-all" aria-label="Refresh">
          <RefreshCw className={cn('w-6 h-6 text-stone-300', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Alert Banner */}
      {data && (
        <div className={cn('border-2 rounded-2xl p-5 flex items-center gap-4', alertStyle.bg)}>
          <span className={cn('p-2 rounded-full text-stone-900', alertStyle.badge)}>{alertStyle.icon}</span>
          <div>
            <p className={cn('font-bold text-xl', alertStyle.text)}>{ALERT_LABELS[data.alert_level]}</p>
            <p className="text-base text-stone-300 mt-1">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</p>
          </div>
        </div>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-sky-400 animate-spin" />
            <p className="text-xl text-stone-400">{t.climate_loading}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Baseline vs Forecast */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">📊 {t.climate_baseline_label}</h3>
              <BaselineStat icon={<CloudRain   className="w-5 h-5 text-sky-400"    />} value={`${data.baseline_40yr.avg_rainfall_mm}`}   unit="mm" label="Rainfall"    />
              <BaselineStat icon={<Thermometer className="w-5 h-5 text-red-400"    />} value={`${data.baseline_40yr.avg_temp_celsius}`}   unit="°C" label="Avg Temp"   />
              <BaselineStat icon={<Sprout      className="w-5 h-5 text-emerald-400"/>} value={`${data.baseline_40yr.organic_carbon_pct}`} unit="%"  label="Org. Carbon"/>
              <div className="pt-2 border-t border-stone-600">
                <p className="text-base text-stone-400">Monsoon Onset</p>
                <p className="text-lg font-semibold text-stone-200 mt-0.5">{data.baseline_40yr.onset_date}</p>
              </div>
            </div>

            <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">🌤️ {t.climate_forecast_label}</h3>
              <div className="space-y-2 overflow-y-auto max-h-52">
                {data.forecast_14d.slice(0, 7).map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between text-base py-1.5 border-b border-stone-700 last:border-0">
                    <span className="text-stone-400 w-16 shrink-0">{day.date}</span>
                    <span className="text-stone-200">{day.condition}</span>
                    <span className="text-sky-300 font-semibold">{day.rainfall_mm.toFixed(0)}mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Step Action Guide */}
          <div className="bg-stone-800 border border-stone-600 rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-bold text-stone-300 uppercase tracking-wide">📋 Climate Adaptation Steps</h3>
            <ActionStep number={1} title={t.climate_step1_title} color="amber"
              detail={data.sowing_shift_days > 0 ? `Delay sowing by ${data.sowing_shift_days} days` : 'Sow at normal time'} />
            <ActionStep number={2} title={t.climate_step2_title} color="emerald"
              detail={data.recommended_seeds.join(' · ')} />
            <ActionStep number={3} title={t.climate_step3_title} color="sky"
              detail={data.mulching_action} />
          </div>

          {/* Rainfall Bar Chart */}
          <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5">
            <h3 className="text-base font-bold text-stone-400 uppercase mb-4">14-Day Rainfall Forecast</h3>
            <div className="flex items-end gap-1 h-24">
              {data.forecast_14d.map((day, idx) => {
                const maxRain = Math.max(...data.forecast_14d.map((d) => d.rainfall_mm));
                const heightPct = (day.rainfall_mm / maxRain) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-sky-500 rounded-t-sm" style={{ height: `${heightPct}%` }} title={`${day.date}: ${day.rainfall_mm.toFixed(1)}mm`} />
                    <span className="text-[10px] text-stone-500">{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-base text-amber-400 text-center">⚠️ {error}</p>}
        </>
      )}
    </section>
  );
}

function BaselineStat({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-base text-stone-400">{label}</span></div>
      <span className="text-lg font-bold text-stone-100">{value}<span className="text-sm font-normal text-stone-400 ml-1">{unit}</span></span>
    </div>
  );
}

const STEP_COLORS = { amber: 'bg-amber-500 text-stone-900', emerald: 'bg-emerald-500 text-stone-900', sky: 'bg-sky-500 text-stone-900' };

function ActionStep({ number, title, detail, color }: { number: number; title: string; detail: string; color: 'amber' | 'emerald' | 'sky' }) {
  return (
    <div className="flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0', STEP_COLORS[color])}>
        {number}
      </div>
      <div className="flex-1">
        <p className="text-lg font-semibold text-stone-200">{title}</p>
        <p className="text-base text-stone-400 mt-1">{detail}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-stone-600 mt-2 shrink-0" />
    </div>
  );
}
