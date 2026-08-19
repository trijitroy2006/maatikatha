'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface WaveformAnimationProps {
  audioLevel: number;    // 0–100
  isListening: boolean;
  barCount?: number;
}

export function WaveformAnimation({
  audioLevel,
  isListening,
  barCount = 20,
}: WaveformAnimationProps) {
  const bars = Array.from({ length: barCount });

  return (
    <div className="flex items-center justify-center gap-[3px] h-14 w-full">
      {bars.map((_, idx) => {
        // Each bar has a sine-wave phase offset for smooth ripple
        const phase = (idx / barCount) * Math.PI * 2;
        const sineVal = Math.abs(Math.sin(phase + Date.now() / 400));

        const baseHeight = isListening
          ? 8 + (audioLevel / 100) * 44 * (0.3 + 0.7 * sineVal)
          : 4 + idx % 3 * 2; // Static pattern when idle

        const heightPx = Math.max(4, Math.min(56, baseHeight));

        return (
          <div
            key={idx}
            className={cn(
              'rounded-full transition-all',
              isListening
                ? idx % 2 === 0
                  ? 'bg-emerald-400'
                  : 'bg-emerald-300'
                : 'bg-stone-600'
            )}
            style={{
              width: '4px',
              height: `${heightPx}px`,
              animationDelay: `${idx * 50}ms`,
              animation: isListening
                ? `waveBar 0.8s ease-in-out ${idx * 40}ms infinite alternate`
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}
