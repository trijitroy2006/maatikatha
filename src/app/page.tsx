'use client';

import React, { useState } from 'react';
import { SimulatorPanel } from '@/components/Simulator/SimulatorPanel';
import { RituRakhokCard } from '@/components/RituRakhok/RituRakhokCard';
import { VoiceDoctorUI } from '@/components/VoiceDoctor/VoiceDoctorUI';
import { KhamarDrishtiMap } from '@/components/KhamarDrishti/KhamarDrishtiMap';
import { BottomNav, TabId } from '@/components/Navigation/BottomNav';
import { SideNav } from '@/components/Navigation/SideNav';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import {
  Leaf, Sun, CloudRain, TrendingUp, Mic, Map, Zap,
  Droplets, Thermometer, Wind, AlertTriangle,
} from 'lucide-react';

// ---- Stat Card ----
function StatCard({
  icon, label, value, unit, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-2xl p-6 flex items-center gap-5">
      <div className={cn('p-4 rounded-2xl', color)}>{icon}</div>
      <div>
        <p className="text-base text-stone-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-stone-100 mt-0.5">
          {value}
          <span className="text-lg font-normal text-stone-400 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ---- Quick Access Card ----
function QuickCard({
  icon: Icon, title, desc, color, iconBg, onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  iconBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-stone-800 border border-stone-700 hover:border-stone-500 rounded-2xl p-7 text-left transition-all active:scale-[0.98] hover:bg-stone-750 hover:shadow-xl"
    >
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', iconBg)}>
        <Icon className={cn('w-8 h-8', color)} />
      </div>
      <p className="text-xl font-bold text-stone-100 group-hover:text-white transition-colors">{title}</p>
      <p className="text-base text-stone-400 mt-1.5 leading-relaxed">{desc}</p>
    </button>
  );
}

// ---- Home Dashboard ----
function HomeDashboard({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-amber-950/60 via-stone-800 to-stone-900 border border-stone-700 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/8 rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-emerald-500/6 rounded-full translate-y-16 pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3.5 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/30">
                <Leaf className="w-9 h-9 text-stone-900" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-amber-400 leading-none">MaatiKatha</h1>
                <p className="text-lg text-stone-400 mt-1">{t.tagline}</p>
              </div>
            </div>
            <p className="text-base text-stone-500 mt-2 max-w-lg">
              Zero-hardware, voice-first generational farm simulation and climate resilience platform
              for rural farmers in West Bengal.
            </p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-700 rounded-full px-4 py-2 shrink-0">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-base font-semibold text-emerald-400">Live</span>
          </div>
        </div>

        {/* Weather strip */}
        <div className="relative flex items-center gap-8 mt-7 pt-6 border-t border-stone-700/60">
          <WeatherPill icon={<Sun className="w-5 h-5 text-amber-400" />}        label="Temperature" value="34°C"        />
          <WeatherPill icon={<CloudRain className="w-5 h-5 text-sky-400" />}     label="Humidity"    value="72%"         />
          <WeatherPill icon={<Wind className="w-5 h-5 text-stone-400" />}        label="Wind"        value="18 km/h"     />
          <WeatherPill icon={<Droplets className="w-5 h-5 text-blue-400" />}     label="Rainfall"    value="4.2 mm"      />
          <WeatherPill icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} label="Season"     value="Rice Season" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Thermometer className="w-7 h-7 text-red-400"     />} label="Soil Temp"      value="29"    unit="°C"    color="bg-red-950/60"     />
        <StatCard icon={<Droplets    className="w-7 h-7 text-sky-400"     />} label="Soil Moisture"  value="62"    unit="%"     color="bg-sky-950/60"     />
        <StatCard icon={<AlertTriangle className="w-7 h-7 text-amber-400" />} label="Pest Risk"      value="Med"   unit=""      color="bg-amber-950/60"   />
        <StatCard icon={<CloudRain   className="w-7 h-7 text-emerald-400" />} label="Rain Forecast"  value="45"    unit="%"     color="bg-emerald-950/60" />
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-2xl font-bold text-stone-200 mb-5">Quick Access</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <QuickCard icon={Zap}       title={t.nav_simulator} desc="Simulate crop yield using historical & what-if scenarios"     color="text-amber-400"   iconBg="bg-amber-950"   onClick={() => onTabChange('simulator')} />
          <QuickCard icon={CloudRain} title={t.nav_climate}   desc="Compare 40-year baselines against 14-day live forecasts"      color="text-sky-400"     iconBg="bg-sky-950"     onClick={() => onTabChange('climate')}   />
          <QuickCard icon={Mic}       title={t.nav_doctor}    desc="Voice-first AI field doctor — speak your crop problem"        color="text-emerald-400" iconBg="bg-emerald-950" onClick={() => onTabChange('doctor')}    />
          <QuickCard icon={Map}       title={t.nav_map}       desc="Real-time pest radar with airborne disease spread overlays"   color="text-red-400"     iconBg="bg-red-950"     onClick={() => onTabChange('map')}       />
        </div>
      </div>

      {/* Bottom two-col: Climate preview + Pest alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Status */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-7">
          <h3 className="text-xl font-bold text-stone-200 mb-5">Today's Farm Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Soil Moisture',    value: '62%',    bar: 62,  color: 'bg-sky-500'     },
              { label: 'Avg Temperature',  value: '34°C',   bar: 68,  color: 'bg-orange-500'  },
              { label: 'Rain Probability', value: '45%',    bar: 45,  color: 'bg-blue-500'    },
              { label: 'Pest Risk',        value: 'Medium', bar: 50,  color: 'bg-amber-500'   },
              { label: 'Crop Health',      value: 'Good',   bar: 78,  color: 'bg-emerald-500' },
            ].map(({ label, value, bar, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base text-stone-400">{label}</span>
                  <span className="text-base font-bold text-stone-100">{value}</span>
                </div>
                <div className="h-2.5 bg-stone-700 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-stone-800 border border-stone-700 rounded-2xl p-7">
          <h3 className="text-xl font-bold text-stone-200 mb-5">Active Alerts</h3>
          <div className="space-y-4">
            {[
              { title: 'Rice Blast Detected',          detail: '3.5 km spread radius · SW wind · 18 km/h', level: 'critical', emoji: '🦠' },
              { title: 'Brown Plant Hopper Warning',   detail: '2.0 km spread radius · S wind · 12 km/h',  level: 'high',     emoji: '🐛' },
              { title: 'Sowing Delay Recommended',     detail: 'Delay by 7 days based on 14-day forecast', level: 'watch',    emoji: '📅' },
              { title: 'Low Carbon Content Detected',  detail: 'Plot P3 — Organic carbon at 0.44%',        level: 'watch',    emoji: '🌱' },
            ].map(({ title, detail, level, emoji }) => (
              <div key={title} className={cn(
                'flex items-start gap-4 p-4 rounded-xl border',
                level === 'critical' ? 'bg-red-950/40    border-red-800'    :
                level === 'high'     ? 'bg-orange-950/40 border-orange-800' :
                                       'bg-amber-950/40  border-amber-800'
              )}>
                <span className="text-2xl mt-0.5">{emoji}</span>
                <div>
                  <p className="text-base font-semibold text-stone-100">{title}</p>
                  <p className="text-sm text-stone-400 mt-0.5">{detail}</p>
                </div>
                <span className={cn(
                  'ml-auto text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5',
                  level === 'critical' ? 'bg-red-500    text-white' :
                  level === 'high'     ? 'bg-orange-500 text-white' :
                                         'bg-amber-500  text-stone-900'
                )}>{level.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className="text-xs text-stone-500 leading-none">{label}</p>
        <p className="text-base font-semibold text-stone-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':      return <HomeDashboard onTabChange={setActiveTab} />;
      case 'simulator': return <SimulatorPanel />;
      case 'climate':   return <RituRakhokCard />;
      case 'doctor':    return <VoiceDoctorUI />;
      case 'map':       return <KhamarDrishtiMap />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-950 text-stone-100">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden lg:block shrink-0">
        <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 pb-24 lg:pb-8">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
