'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  valueDisplay?: string;
  className?: string;
  trackColor?: string;
}

export function RangeSlider({
  min, max, value, onChange, step = 1,
  label, valueDisplay, className, trackColor = 'bg-amber-500',
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-stone-200">{label}</span>
          <span className={cn('text-xl font-bold px-4 py-1 rounded-full text-stone-900', trackColor)}>
            {valueDisplay ?? value}
          </span>
        </div>
      )}

      {/* Value badge (when no label) */}
      {!label && valueDisplay && (
        <div className="flex justify-center mb-3">
          <span className={cn('text-2xl font-bold px-5 py-1.5 rounded-full text-stone-900', trackColor)}>
            {valueDisplay}
          </span>
        </div>
      )}

      <div className="relative h-12 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-4 bg-stone-700 rounded-full shadow-inner" />

        {/* Filled track */}
        <div
          className={cn('absolute h-4 rounded-full transition-all', trackColor)}
          style={{ width: `${pct}%` }}
        />

        {/* Range input — invisible but interactive */}
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
          style={{ WebkitAppearance: 'none' }}
          aria-label={label}
        />

        {/* Custom thumb */}
        <div
          className={cn('absolute w-9 h-9 rounded-full border-4 border-stone-900 shadow-lg transition-all', trackColor)}
          style={{ left: `calc(${pct}% - ${(pct / 100) * 36}px)`, pointerEvents: 'none' }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-2">
        <span className="text-base text-stone-400 font-semibold">{min}</span>
        <span className="text-base text-stone-400 font-semibold">{max}</span>
      </div>
    </div>
  );
}
