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
  thumbLabel?: boolean;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  valueDisplay,
  className,
  trackColor = 'bg-amber-500',
  thumbLabel = true,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-200 font-bengali">
            {label}
          </span>
          <span
            className={cn(
              'text-lg font-bold px-3 py-0.5 rounded-full text-stone-900',
              trackColor
            )}
          >
            {valueDisplay ?? value}
          </span>
        </div>
      )}

      <div className="relative h-10 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-3 bg-stone-700 rounded-full shadow-inner" />

        {/* Filled track */}
        <div
          className={cn('absolute h-3 rounded-full transition-all', trackColor)}
          style={{ width: `${pct}%` }}
        />

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-3 opacity-0 cursor-pointer z-10"
          style={{ WebkitAppearance: 'none' }}
          aria-label={label}
        />

        {/* Custom thumb */}
        <div
          className={cn(
            'absolute w-7 h-7 rounded-full border-4 border-stone-900 shadow-lg transition-all',
            trackColor
          )}
          style={{
            left: `calc(${pct}% - ${(pct / 100) * 28}px)`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-stone-400">{min}</span>
        <span className="text-xs text-stone-400">{max}</span>
      </div>
    </div>
  );
}
