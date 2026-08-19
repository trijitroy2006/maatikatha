'use client';

import React from 'react';
import { Home, Zap, CloudRain, Mic, Map } from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'simulator' | 'climate' | 'doctor' | 'map';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: React.ElementType; labelKey: 'nav_home' | 'nav_simulator' | 'nav_climate' | 'nav_doctor' | 'nav_map'; color: string }[] = [
  { id: 'home',      icon: Home,      labelKey: 'nav_home',      color: 'text-stone-200' },
  { id: 'simulator', icon: Zap,       labelKey: 'nav_simulator', color: 'text-amber-400' },
  { id: 'climate',   icon: CloudRain, labelKey: 'nav_climate',   color: 'text-sky-400'   },
  { id: 'doctor',    icon: Mic,       labelKey: 'nav_doctor',    color: 'text-emerald-400'},
  { id: 'map',       icon: Map,       labelKey: 'nav_map',       color: 'text-red-400'   },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-stone-900/95 backdrop-blur-sm border-t-2 border-stone-700 safe-area-inset-bottom">
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {TABS.map(({ id, icon: Icon, labelKey, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-95',
                isActive ? color : 'text-stone-500 hover:text-stone-300'
              )}
              aria-label={t[labelKey]}
            >
              <div className={cn('p-2 rounded-xl transition-all', isActive && 'bg-stone-700')}>
                <Icon className="w-7 h-7" strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={cn('text-xs font-bold leading-tight transition-all', isActive ? 'opacity-100' : 'opacity-50')}>
                {t[labelKey]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
