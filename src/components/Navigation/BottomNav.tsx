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

const TABS: { id: TabId; icon: any; label: string; color: string }[] = [
  { id: 'home',      icon: Home,       label: 'HOME',      color: 'bg-black text-[#FFD600]' },
  { id: 'simulator', icon: Zap,        label: 'SIM',       color: 'bg-[#FFD600] text-black' },
  { id: 'climate',   icon: CloudRain,  label: 'CLIMATE',   color: 'bg-white text-black' },
  { id: 'doctor',    icon: Mic,        label: 'DOCTOR',    color: 'bg-[#1B5E20] text-white' },
  { id: 'map',       icon: Map,        label: 'RADAR',     color: 'bg-[#D50000] text-white' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#FFFDE7] border-t-4 border-black safe-area-inset-bottom">
      <div className="flex w-full overflow-x-auto">
        {TABS.map(({ id, icon: Icon, label, color }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 min-w-[72px] border-r-4 border-black last:border-r-0 transition-all',
                isActive ? color : 'bg-[#FFFDE7] text-black hover:bg-yellow-50'
              )}
            >
              <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 3 : 2} />
              <span className="text-[10px] font-black">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
