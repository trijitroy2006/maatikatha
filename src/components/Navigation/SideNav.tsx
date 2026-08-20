'use client';

import React from 'react';
import { Home, Zap, CloudRain, Mic, Map, Leaf, Camera, TrendingUp, Clock } from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { TabId } from './BottomNav';
import Link from 'next/link';

const TABS: {
  id: TabId | 'time-machine';
  icon: any;
  label: string;
  color: string;
  activeBg: string;
  desc: string;
}[] = [
  { id: 'home',      icon: Home,       label: 'DASHBOARD',      color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Farm Overview'            },
  { id: 'simulator', icon: Zap,        label: 'SIMULATOR',      color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'What-If Crop Yield' },
  { id: 'climate',   icon: CloudRain,  label: 'RITURAKHOK',     color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Climate Forecast'     },
  { id: 'doctor',    icon: Mic,        label: 'FIELD DOCTOR',   color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Voice AI Diagnosis'      },
  { id: 'map',       icon: Map,        label: 'PEST RADAR',     color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Spread Map'       },
  { id: 'uploader',  icon: Camera,     label: 'PHOTO UPLOAD',   color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Camera Input' },
  { id: 'mandi',     icon: TrendingUp, label: 'MANDI OPTIMIZER',color: 'text-black',  activeBg: 'bg-[#FFD600]', desc: 'Market Prices' },
];

interface SideNavProps {
  activeTab?: TabId | 'time-machine';
  onTabChange?: (tab: TabId) => void;
}

export function SideNav({ activeTab = 'home', onTabChange }: SideNavProps) {
  const { t } = useI18n();

  return (
    <aside className="w-80 h-screen sticky top-0 flex flex-col bg-[#FFFDE7] border-r-4 border-black overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-4 px-6 py-8 border-b-4 border-black bg-[#FFD600]">
        <div className="p-3 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Leaf className="w-8 h-8 text-black" />
        </div>
        <div>
          <p className="text-3xl font-black text-black leading-none tracking-tight">MaatiKatha</p>
          <p className="text-sm font-bold text-black mt-1 uppercase">Farm Intelligence</p>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-sm font-black text-black uppercase tracking-widest bg-black text-[#FFD600] inline-block px-2 py-1">NAVIGATION</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-3 mt-4">
        {TABS.map(({ id, icon: Icon, label, color, activeBg, desc }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange && id !== 'time-machine' ? onTabChange(id as TabId) : undefined}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-4 border-4 border-black text-left transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                isActive
                  ? cn(activeBg, 'translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]')
                  : 'bg-white hover:bg-yellow-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              )}
            >
              <div className="text-black">
                <Icon className="w-7 h-7" strokeWidth={isActive ? 3 : 2} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black leading-none text-black tracking-tight">{label}</p>
                <p className="text-xs font-bold text-black/70 mt-1 uppercase tracking-wider truncate">{desc}</p>
              </div>
            </button>
          );
        })}
        
        <Link href="/time-machine" className="w-full flex items-center gap-4 px-4 py-4 border-4 border-black text-left transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-yellow-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-4">
            <div className="text-black">
              <Clock className="w-7 h-7" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-black tracking-tight">TIME MACHINE</p>
              <p className="text-xs font-bold text-black/70 mt-1 uppercase tracking-wider truncate">Historical Baseline</p>
            </div>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t-4 border-black bg-white mt-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-3 bg-[#1B5E20] border-2 border-black rounded-full animate-pulse" />
          <span className="text-sm font-black uppercase text-black">Live Mode</span>
        </div>
        <div className="text-xs font-bold text-black uppercase space-y-1">
          <p>📍 Nadia District, WB</p>
          <p>23.06°N · 88.44°E</p>
        </div>
      </div>
    </aside>
  );
}
