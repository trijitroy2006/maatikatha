'use client';

import React from 'react';
import { Home, Zap, CloudRain, Mic, Map as MapIcon, Leaf, Camera, TrendingUp, Clock, LogOut } from 'lucide-react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import type { TabId } from './BottomNav';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const TABS: {
  id: TabId | 'time-machine';
  icon: any;
  label: string;
  activeColor: string;
  desc: string;
}[] = [
  { id: 'home',      icon: Home,       label: 'Dashboard',      activeColor: 'text-emerald-600 bg-emerald-50', desc: 'Farm Overview' },
  { id: 'simulator', icon: Zap,        label: 'Simulator',      activeColor: 'text-amber-600 bg-amber-50',     desc: 'What-If Crop Yield' },
  { id: 'climate',   icon: CloudRain,  label: 'RituRakhok',     activeColor: 'text-sky-600 bg-sky-50',         desc: 'Climate Forecast' },
  { id: 'doctor',    icon: Mic,        label: 'Field Doctor',   activeColor: 'text-indigo-600 bg-indigo-50',   desc: 'Voice AI Diagnosis' },
  { id: 'map',       icon: MapIcon,    label: 'Pest Radar',     activeColor: 'text-rose-600 bg-rose-50',       desc: 'Spread Map' },
  { id: 'uploader',  icon: Camera,     label: 'Photo Upload',   activeColor: 'text-blue-600 bg-blue-50',       desc: 'Camera Input' },
  { id: 'mandi',     icon: TrendingUp, label: 'Mandi Optimizer',activeColor: 'text-emerald-600 bg-emerald-50', desc: 'Market Prices' },
];

interface SideNavProps {
  activeTab?: TabId | 'time-machine';
  onTabChange?: (tab: TabId) => void;
}

export function SideNav({ activeTab = 'home', onTabChange }: SideNavProps) {
  const { t } = useI18n();
  const { farmerName, logout } = useAuth();

  return (
    <aside className="w-full h-screen sticky top-0 flex flex-col bg-white overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-4 px-8 py-8">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Leaf className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 tracking-tight">MaatiKatha</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Farm Intelligence</p>
        </div>
      </div>

      {/* Nav Section Label */}
      <div className="px-8 pt-4 pb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {TABS.map(({ id, icon: Icon, label, activeColor, desc }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange && id !== 'time-machine' ? onTabChange(id as TabId) : undefined}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all group',
                isActive
                  ? activeColor
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className={cn("transition-colors", isActive ? "" : "text-slate-400 group-hover:text-slate-600")}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-base leading-none tracking-tight", isActive ? "font-bold" : "font-medium")}>{label}</p>
                <p className={cn("text-xs mt-1 truncate", isActive ? "opacity-80 font-medium" : "text-slate-400")}>{desc}</p>
              </div>
            </button>
          );
        })}
        
        <Link href="/time-machine" className={cn(
            'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all group mt-6',
            activeTab === 'time-machine' ? 'text-purple-600 bg-purple-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}>
            <div className={cn("transition-colors", activeTab === 'time-machine' ? "" : "text-slate-400 group-hover:text-slate-600")}>
              <Clock className="w-6 h-6" strokeWidth={activeTab === 'time-machine' ? 2.5 : 2} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-base leading-none tracking-tight", activeTab === 'time-machine' ? "font-bold" : "font-medium")}>Time Machine</p>
              <p className={cn("text-xs mt-1 truncate", activeTab === 'time-machine' ? "opacity-80 font-medium" : "text-slate-400")}>Historical Baseline</p>
            </div>
        </Link>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-6 border-t border-slate-100 mt-6">
        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 font-bold text-lg">
              {farmerName ? farmerName.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{farmerName || 'Farmer'}</p>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
