'use client';

import React from 'react';
import { Home, Zap, CloudRain, Mic, Map, Camera, TrendingUp } from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'simulator' | 'climate' | 'doctor' | 'map' | 'uploader' | 'mandi';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: any; label: string; activeColor: string }[] = [
  { id: 'home',      icon: Home,       label: 'Home',      activeColor: 'text-emerald-600' },
  { id: 'simulator', icon: Zap,        label: 'Sim',       activeColor: 'text-amber-500' },
  { id: 'climate',   icon: CloudRain,  label: 'Climate',   activeColor: 'text-sky-500' },
  { id: 'doctor',    icon: Mic,        label: 'Doctor',    activeColor: 'text-indigo-500' },
  { id: 'map',       icon: Map,        label: 'Radar',     activeColor: 'text-rose-500' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 safe-area-inset-bottom shadow-lg">
      <div className="flex w-full overflow-x-auto px-2 pb-1">
        {TABS.map(({ id, icon: Icon, label, activeColor }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 min-w-[72px] transition-all relative',
                isActive ? activeColor : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className="w-6 h-6 mb-1 transition-transform duration-200" style={{ transform: isActive ? 'translateY(-2px)' : 'none' }} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] transition-all", isActive ? "font-bold" : "font-medium")}>{label}</span>
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-current"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
