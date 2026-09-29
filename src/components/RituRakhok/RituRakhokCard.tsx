'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClimateData } from '@/lib/api';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { ClimateResponse } from '@/lib/types';
import {
  CloudRain, Thermometer, Sprout, AlertOctagon, RefreshCw,
  CheckCircle2, ChevronDown, ChevronUp, Calendar, Leaf, Layers,
} from 'lucide-react';

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_CLIMATE: ClimateResponse = {
  baseline_40yr: {
    avg_rainfall_mm: 1380,
    avg_temp_celsius: 27.4,
    organic_carbon_pct: 0.62,
    onset_date: 'June 10',
    cessation_date: 'September 28',
  },
  forecast_14d: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    rainfall_mm: Math.random() > 0.3 ? parseFloat((Math.random() * 18 + 2).toFixed(1)) : 0,
    temp_max: parseFloat((32 + Math.random() * 5).toFixed(1)),
    temp_min: parseFloat((24 + Math.random() * 3).toFixed(1)),
    humidity_pct: Math.round(60 + Math.random() * 30),
    condition: ['Clear Sky', 'Partly Cloudy', 'Rainy', 'Thunderstorm'][Math.floor(Math.random() * 4)],
  })),
  sowing_shift_days: 7,
  recommended_seeds: ['Satabdi Rice', 'CR Dhan 401', 'Ranjit'],
  mulching_action: 'Apply 5 cm straw mulch to retain soil moisture',
  alert_level: 'watch',
};

// ── Alert styles ──────────────────────────────────────────────────────────────
const ALERT_STYLES = {
  normal:   { bg: 'bg-emerald-900/60 border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500', Icon: CheckCircle2 },
  watch:    { bg: 'bg-amber-900/60   border-amber-500',   text: 'text-amber-300',   badge: 'bg-amber-500',   Icon: AlertOctagon },
  warning:  { bg: 'bg-orange-900/60  border-orange-500',  text: 'text-orange-300',  badge: 'bg-orange-500',  Icon: AlertOctagon },
  critical: { bg: 'bg-red-900/60     border-red-500',     text: 'text-red-300',     badge: 'bg-red-500',     Icon: AlertOctagon },
};
const ALERT_LABELS = { normal: 'Normal', watch: 'Watch', warning: 'Warning', critical: 'Critical Alert' };

// ── Condition emoji map ───────────────────────────────────────────────────────
function conditionEmoji(c: string) {
  if (c.includes('Thunder')) return '⛈️';
  if (c.includes('Rain'))    return '🌧️';
  if (c.includes('Cloudy'))  return '⛅';
  if (c.includes('Foggy'))   return '🌫️';
  if (c.includes('Snow'))    return '❄️';
  return '☀️';
}

// ── Date formatter ────────────────────────────────────────────────────────────
function fmtDate(raw: string) {
  try {
    const d = new Date(raw.length === 10 ? raw + 'T00:00:00' : raw);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return raw; }
}

// ── Bar color by intensity ────────────────────────────────────────────────────
function barColor(mm: number) {
  if (mm === 0)   return '#44403c'; // stone-700 dry
  if (mm < 2)     return '#7dd3fc'; // sky-300
  if (mm < 10)    return '#0ea5e9'; // sky-500
  if (mm < 30)    return '#3b82f6'; // blue-500
  return '#1d4ed8';                 // blue-700 heavy
}

// ── Step definitions ──────────────────────────────────────────────────────────
interface StepDef {
  id: number;
  color: 'amber' | 'emerald' | 'sky';
  Icon: React.ElementType;
  titleKey: 'climate_step1_title' | 'climate_step2_title' | 'climate_step3_title';
}
const STEPS: StepDef[] = [
  { id: 1, color: 'amber',   Icon: Calendar, titleKey: 'climate_step1_title' },
  { id: 2, color: 'emerald', Icon: Leaf,     titleKey: 'climate_step2_title' },
  { id: 3, color: 'sky',     Icon: Layers,   titleKey: 'climate_step3_title' },
];

const STEP_BADGE = {
  amber:   'bg-amber-500   text-stone-900',
  emerald: 'bg-emerald-500 text-stone-900',
  sky:     'bg-sky-500     text-stone-900',
};
const STEP_ACCENT = {
  amber:   'text-amber-300   border-amber-700',
  emerald: 'text-emerald-300 border-emerald-700',
  sky:     'text-sky-300     border-sky-700',
};

interface RituRakhokCardProps { lat?: number; lon?: number; }

// ── Main component ────────────────────────────────────────────────────────────
export function RituRakhokCard({ lat = 23.06, lon = 88.46 }: RituRakhokCardProps) {
  const { t } = useI18n();
  const [data,      setData]      = useState<ClimateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<number | null>(null); // which step is expanded

  const fetchClimate = useCallback(async () => {
    setIsLoading(true); setError(null);
    try { setData(await getClimateData({ lat, lon })); }
    catch { setError('Demo mode — backend not connected'); setData(MOCK_CLIMATE); }
    finally { setIsLoading(false); }
  }, [lat, lon]);

  useEffect(() => { fetchClimate(); }, [fetchClimate]);

  const alertStyle = ALERT_STYLES[data?.alert_level ?? 'normal'];
  const AlertIcon  = alertStyle.Icon;

  // ── Step click handler ────────────────────────────────────────────────────
  const handleStepClick = (id: number) =>
    setExpanded(prev => prev === id ? null : id);

  // ── Step expanded detail text ─────────────────────────────────────────────
  const stepDetail = (id: number): string => {
    if (!data) return '';
    if (id === 1) return data.sowing_shift_days > 0
      ? `Based on current temperature trends, delay sowing by ${data.sowing_shift_days} days from the normal schedule to improve germination success rate.`
      : `Current conditions are favorable. Sow at the normal scheduled time. Monitor daily temperature and soil moisture before planting.`;
    if (id === 2) return `Recommended varieties for your location: ${data.recommended_seeds.join(', ')}. These seeds are selected based on the 14-day rainfall and temperature forecast.`;
    if (id === 3) return `${data.mulching_action}. Mulching reduces evaporation, keeps roots cool, and suppresses weeds — especially important during dry spells.`;
    return '';
  };

  // ── Bar chart — uses absolute pixel heights to avoid % flex bug ───────────
  const CHART_HEIGHT_PX = 96; // container height in px

  const renderBarChart = () => {
    if (!data) return null;
    const maxRain = Math.max(...data.forecast_14d.map(d => d.rainfall_mm), 1);

    return (
      <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">☔ 14-Day Rainfall Forecast</h3>
          <span className="text-xs text-stone-600 italic">Hover bars for details</span>
        </div>

        {/* Y-axis + bars */}
        <div className="flex gap-2">
          {/* Y axis labels */}
          <div
            className="flex flex-col justify-between text-[9px] text-stone-600 text-right pr-1 shrink-0"
            style={{ height: CHART_HEIGHT_PX }}
          >
            <span>{maxRain.toFixed(0)}mm</span>
            <span>{(maxRain / 2).toFixed(0)}mm</span>
            <span>0</span>
          </div>

          {/* Bars — use position:relative + absolute inner div for reliable heights */}
          <div
            className="flex-1 flex items-end gap-[3px] border-b border-l border-stone-700 pb-0"
            style={{ height: CHART_HEIGHT_PX }}
          >
            {data.forecast_14d.map((day, idx) => {
              const heightPx = day.rainfall_mm > 0
                ? Math.max((day.rainfall_mm / maxRain) * CHART_HEIGHT_PX, 7)
                : 2;
              const color = barColor(day.rainfall_mm);
              const label = fmtDate(day.date);

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col justify-end items-center group relative"
                  style={{ height: '100%' }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                    <div
                      className="rounded-xl px-3 py-2 text-center whitespace-nowrap shadow-2xl text-[11px]"
                      style={{ background: '#1c1917', border: '1px solid #57534e' }}
                    >
                      <div className="font-bold text-sky-300">{label}</div>
                      <div className="text-stone-100 font-semibold">{day.rainfall_mm.toFixed(1)} mm</div>
                      <div className="text-stone-400">{conditionEmoji(day.condition)} {day.condition}</div>
                      <div className="text-stone-500">{day.temp_max}° / {day.temp_min}°C · {day.humidity_pct}% hum</div>
                    </div>
                    <div
                      className="w-0 h-0"
                      style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1c1917' }}
                    />
                  </div>

                  {/* Bar — explicit px height, no % */}
                  <div
                    className="w-full rounded-t-sm transition-all duration-700"
                    style={{ height: `${heightPx}px`, backgroundColor: color }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis day numbers */}
        <div className="flex gap-[3px] mt-1 pl-8">
          {data.forecast_14d.map((_, idx) => (
            <div key={idx} className="flex-1 text-center">
              <span className="text-[8px] text-stone-600">{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
          {[
            { color: '#44403c', label: 'Dry' },
            { color: '#7dd3fc', label: '< 2mm' },
            { color: '#0ea5e9', label: '2–10mm' },
            { color: '#3b82f6', label: '10–30mm' },
            { color: '#1d4ed8', label: '> 30mm' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-stone-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <span className={cn('p-2 rounded-full text-stone-900', alertStyle.badge)}>
            <AlertIcon className="w-6 h-6" />
          </span>
          <div>
            <p className={cn('font-bold text-xl', alertStyle.text)}>{ALERT_LABELS[data.alert_level]}</p>
            <p className="text-base text-stone-300 mt-1">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</p>
          </div>
        </div>
      )}

      {/* Loading */}
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
          {/* Baseline + Forecast list */}
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
              <div className="space-y-0 overflow-y-auto max-h-52">
                {data.forecast_14d.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-stone-700/60 last:border-0">
                    <span className="text-stone-400 w-14 shrink-0 text-xs">{fmtDate(day.date)}</span>
                    <span className="text-stone-200 text-xs flex-1 text-center">{conditionEmoji(day.condition)} {day.condition}</span>
                    <span className="text-sky-300 font-semibold text-xs">{day.rainfall_mm.toFixed(1)}mm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 14-Day Rainfall Bar Chart (FIX: px heights, not %) ── */}
          {renderBarChart()}

          {/* ── Climate Adaptation Steps (FIX: interactive expand/collapse) ── */}
          <div className="bg-stone-800 border border-stone-600 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-bold text-stone-300 uppercase tracking-wide mb-2">📋 Climate Adaptation Steps</h3>
            {STEPS.map(({ id, color, Icon, titleKey }) => {
              const isOpen = expanded === id;
              return (
                <div
                  key={id}
                  className={cn(
                    'rounded-xl border transition-all duration-200 cursor-pointer select-none',
                    isOpen
                      ? `border-${color === 'amber' ? 'amber' : color === 'emerald' ? 'emerald' : 'sky'}-600 bg-stone-700/80`
                      : 'border-stone-700 hover:border-stone-500 hover:bg-stone-700/50'
                  )}
                  onClick={() => handleStepClick(id)}
                  role="button"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Step badge */}
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0', STEP_BADGE[color])}>
                      {id}
                    </div>
                    {/* Icon + title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={cn('w-5 h-5 shrink-0', STEP_ACCENT[color].split(' ')[0])} />
                      <p className="text-base font-semibold text-stone-200 truncate">{t[titleKey]}</p>
                    </div>
                    {/* Chevron */}
                    {isOpen
                      ? <ChevronUp   className="w-5 h-5 text-stone-400 shrink-0" />
                      : <ChevronDown className="w-5 h-5 text-stone-500 shrink-0" />
                    }
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className={cn('px-4 pb-4 border-t', STEP_ACCENT[color].split(' ')[1])}>
                      <p className="text-sm text-stone-300 mt-3 leading-relaxed">{stepDetail(id)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-base text-amber-400 text-center">⚠️ {error}</p>}
        </>
      )}
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BaselineStat({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-base text-stone-400">{label}</span></div>
      <span className="text-lg font-bold text-stone-100">{value}<span className="text-sm font-normal text-stone-400 ml-1">{unit}</span></span>
    </div>
  );
}
