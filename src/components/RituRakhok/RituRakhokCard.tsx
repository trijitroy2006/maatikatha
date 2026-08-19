'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClimateData } from '@/lib/api';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { ClimateResponse } from '@/lib/types';
import {
  CloudRain,
  Thermometer,
  Sprout,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

// Mock data fallback for demo / offline
const MOCK_CLIMATE: ClimateResponse = {
  baseline_40yr: {
    avg_rainfall_mm: 1380,
    avg_temp_celsius: 27.4,
    organic_carbon_pct: 0.62,
    onset_date: 'June 10',
    cessation_date: 'September 28',
  },
  forecast_14d: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    }),
    rainfall_mm: 4 + Math.random() * 18,
    temp_max: 32 + Math.random() * 5,
    temp_min: 24 + Math.random() * 3,
    humidity_pct: 60 + Math.random() * 30,
    condition: ['☀️ Sunny', '⛅ Partly Cloudy', '🌧️ Rainy', '⛈️ Stormy'][
      Math.floor(Math.random() * 4)
    ],
  })),
  sowing_shift_days: 7,
  recommended_seeds: ['শতাব্দী ধান', 'CR Dhan 401', 'রঞ্জিত'],
  mulching_action: 'ধানের খড় দিয়ে ৫ সেমি মালচিং করুন',
  alert_level: 'watch',
};

const ALERT_STYLES = {
  normal: {
    bg: 'bg-emerald-900/60 border-emerald-500',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  watch: {
    bg: 'bg-amber-900/60 border-amber-500',
    text: 'text-amber-300',
    badge: 'bg-amber-500',
    icon: <AlertOctagon className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-orange-900/60 border-orange-500',
    text: 'text-orange-300',
    badge: 'bg-orange-500',
    icon: <AlertOctagon className="w-5 h-5" />,
  },
  critical: {
    bg: 'bg-red-900/60 border-red-500',
    text: 'text-red-300',
    badge: 'bg-red-500',
    icon: <AlertOctagon className="w-5 h-5 animate-pulse" />,
  },
};

interface RituRakhokCardProps {
  lat?: number;
  lon?: number;
}

export function RituRakhokCard({ lat = 23.06, lon = 88.46 }: RituRakhokCardProps) {
  const { t } = useI18n();
  const [data, setData] = useState<ClimateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClimate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getClimateData({ lat, lon });
      setData(result);
    } catch {
      setError('Backend not connected – showing demo data');
      setData(MOCK_CLIMATE);
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchClimate();
  }, [fetchClimate]);

  const alertStyle = ALERT_STYLES[data?.alert_level ?? 'normal'];

  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500 rounded-xl">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-sky-400 font-bengali">
            {t.climate_title}
          </h2>
        </div>
        <button
          onClick={fetchClimate}
          disabled={isLoading}
          className="p-2 rounded-full bg-stone-700 hover:bg-stone-600 active:scale-95 transition-all"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('w-5 h-5 text-stone-300', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Alert Banner */}
      {data && (
        <div className={cn('border rounded-2xl p-4 flex items-center gap-3', alertStyle.bg)}>
          <span className={cn('p-1.5 rounded-full text-stone-900', alertStyle.badge)}>
            {alertStyle.icon}
          </span>
          <div>
            <p className={cn('font-bold text-base font-bengali', alertStyle.text)}>
              {t[`climate_alert_${data.alert_level}` as keyof typeof t]}
            </p>
            <p className="text-xs text-stone-300 mt-0.5">
              {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
            </p>
          </div>
        </div>
      )}

      {isLoading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-10 h-10 text-sky-400 animate-spin" />
            <p className="text-stone-400 font-bengali">{t.climate_loading}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Baseline vs Forecast Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* 40-Year Baseline */}
            <div className="bg-stone-800 border border-stone-600 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-bengali">
                📊 {t.climate_baseline_label}
              </h3>
              <BaselineStat
                icon={<CloudRain className="w-4 h-4 text-sky-400" />}
                value={`${data.baseline_40yr.avg_rainfall_mm}`}
                unit="mm"
                label="বৃষ্টিপাত"
              />
              <BaselineStat
                icon={<Thermometer className="w-4 h-4 text-red-400" />}
                value={`${data.baseline_40yr.avg_temp_celsius}`}
                unit="°C"
                label="তাপমাত্রা"
              />
              <BaselineStat
                icon={<Sprout className="w-4 h-4 text-emerald-400" />}
                value={`${data.baseline_40yr.organic_carbon_pct}`}
                unit="%"
                label="কার্বন"
              />
              <div className="pt-1 border-t border-stone-600">
                <p className="text-xs text-stone-400">বর্ষা শুরু</p>
                <p className="text-sm font-semibold text-stone-200">{data.baseline_40yr.onset_date}</p>
              </div>
            </div>

            {/* 14-Day Forecast Strip */}
            <div className="bg-stone-800 border border-stone-600 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-bengali">
                🌤️ {t.climate_forecast_label}
              </h3>
              <div className="space-y-1 overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-stone-600">
                {data.forecast_14d.slice(0, 7).map((day, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-stone-700 last:border-0"
                  >
                    <span className="text-stone-400 w-16">{day.date}</span>
                    <span className="text-stone-200">{day.condition}</span>
                    <span className="text-sky-300 font-semibold">
                      {day.rainfall_mm.toFixed(0)}mm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Step Action Guide */}
          <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-stone-300 uppercase tracking-wide">
              📋 জলবায়ু অভিযোজন পদক্ষেপ
            </h3>

            <ActionStep
              number={1}
              title={t.climate_step1_title}
              detail={
                data.sowing_shift_days > 0
                  ? `${data.sowing_shift_days} দিন পিছিয়ে বপন করুন`
                  : 'স্বাভাবিক সময়ে বপন করুন'
              }
              color="amber"
            />

            <ActionStep
              number={2}
              title={t.climate_step2_title}
              detail={data.recommended_seeds.join(' · ')}
              color="emerald"
            />

            <ActionStep
              number={3}
              title={t.climate_step3_title}
              detail={data.mulching_action}
              color="sky"
            />
          </div>

          {/* 14-Day Rainfall Bar Chart */}
          <div className="bg-stone-800 border border-stone-600 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-stone-400 uppercase mb-3">
              ১৪ দিনের বৃষ্টির পূর্বাভাস
            </h3>
            <div className="flex items-end gap-1 h-20">
              {data.forecast_14d.map((day, idx) => {
                const maxRain = Math.max(...data.forecast_14d.map((d) => d.rainfall_mm));
                const heightPct = (day.rainfall_mm / maxRain) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-sky-500 rounded-t-sm transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${day.date}: ${day.rainfall_mm.toFixed(1)}mm`}
                    />
                    <span className="text-[8px] text-stone-500 rotate-0">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <p className="text-xs text-amber-400 text-center font-bengali">⚠️ {error}</p>
          )}
        </>
      )}
    </section>
  );
}

// ---- Sub-components ----
function BaselineStat({
  icon,
  value,
  unit,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-stone-400 font-bengali">{label}</span>
      </div>
      <span className="text-sm font-bold text-stone-100">
        {value}
        <span className="text-xs font-normal text-stone-400 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

const STEP_COLORS = {
  amber: 'bg-amber-500 text-stone-900',
  emerald: 'bg-emerald-500 text-stone-900',
  sky: 'bg-sky-500 text-stone-900',
};

function ActionStep({
  number,
  title,
  detail,
  color,
}: {
  number: number;
  title: string;
  detail: string;
  color: 'amber' | 'emerald' | 'sky';
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
          STEP_COLORS[color]
        )}
      >
        {number}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-stone-200 font-bengali">{title}</p>
        <p className="text-sm text-stone-400 mt-0.5 font-bengali">{detail}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-stone-600 mt-1 shrink-0" />
    </div>
  );
}
