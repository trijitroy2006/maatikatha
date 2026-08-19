'use client';

import React from 'react';
import { Home, Zap, CloudRain, Mic, Map, Leaf } from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { TabId } from './BottomNav';

const TABS: {
  id: TabId;
  icon: React.ElementType;
  labelKey: 'nav_home' | 'nav_simulator' | 'nav_climate' | 'nav_doctor' | 'nav_map';
  color: string;
  activeBg: string;
  desc: string;
}[] = [
  { id: 'home',      icon: Home,      labelKey: 'nav_home',      color: 'text-stone-300',  activeBg: 'bg-stone-700',     desc: 'Dashboard'            },
  { id: 'simulator', icon: Zap,       labelKey: 'nav_simulator', color: 'text-amber-400',  activeBg: 'bg-amber-950/80',  desc: 'Crop Yield Simulator' },
  { id: 'climate',   icon: CloudRain, labelKey: 'nav_climate',   color: 'text-sky-400',    activeBg: 'bg-sky-950/80',    desc: 'Climate Forecast'     },
  { id: 'doctor',    icon: Mic,       labelKey: 'nav_doctor',    color: 'text-emerald-400',activeBg: 'bg-emerald-950/80',desc: 'AI Field Doctor'      },
  { id: 'map',       icon: Map,       labelKey: 'nav_map',       color: 'text-red-400',    activeBg: 'bg-red-950/80',    desc: 'Pest Radar Map'       },
];

interface SideNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SideNav({ activeTab, onTabChange }: SideNavProps) {
  const { t } = useI18n();

  return (
    <aside className="w-72 h-screen sticky top-0 flex flex-col bg-stone-900 border-r border-stone-800 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3.5 px-6 py-7 border-b border-stone-800">
        <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
          <Leaf className="w-7 h-7 text-stone-900" />
        </div>
        <div>
          <p className="text-xl font-bold text-amber-400 leading-none">MaatiKatha</p>
          <p className="text-xs text-stone-500 mt-1">মাটিকথা · Farm Intelligence</p>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {TABS.map(({ id, icon: Icon, labelKey, color, activeBg, desc }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all group',
                isActive
                  ? cn(activeBg, 'shadow-sm')
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-200'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg transition-all',
                isActive ? cn(color, 'bg-stone-900/50') : 'text-stone-500 group-hover:text-stone-300'
              )}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <div className="min-w-0">
                <p className={cn('text-base font-semibold leading-none', isActive ? color : '')}>{t[labelKey]}</p>
                <p className="text-xs text-stone-500 mt-1 truncate">{desc}</p>
              </div>
              {isActive && (
                <div className={cn('ml-auto w-1.5 h-6 rounded-full shrink-0', color.replace('text-', 'bg-'))} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-stone-800 space-y-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-stone-400">Backend: <span className="text-amber-400 font-semibold">Demo Mode</span></span>
        </div>

        {/* Location */}
        <div className="text-xs text-stone-600">
          <p>📍 Nadia District, West Bengal</p>
          <p className="mt-0.5">23.06°N · 88.44°E</p>
        </div>

        <p className="text-xs text-stone-700">MaatiKatha v0.1</p>
      </div>
    </aside>
  );
}
