'use client';

import React, { useState } from 'react';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { RituRakhokCard } from '@/components/RituRakhok/RituRakhokCard';
import { VoiceDoctorUI } from '@/components/VoiceDoctor/VoiceDoctorUI';
import { PestRadarMap } from '@/components/map/PestRadarMap';
import FieldUploader from '@/components/FieldUploader';
import MandiOptimizer from '@/components/MandiOptimizer';
import { BottomNav, TabId } from '@/components/Navigation/BottomNav';
import { SideNav } from '@/components/Navigation/SideNav';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Leaf, Sun, CloudRain, TrendingUp, Mic, Map, Zap,
  Droplets, Thermometer, AlertTriangle, Camera, Clock
} from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode; label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className={cn("rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md bg-white", color)}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm tracking-wide text-slate-500">{label}</span>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-bold text-slate-800">
          {value}<span className="text-lg font-medium ml-1 text-slate-500">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, colorClass, onClick }: {
  icon: any; title: string; desc: string; colorClass: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-white border border-slate-100 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1"
    >
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors", colorClass)}>
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-xl font-bold text-slate-800 leading-tight mb-2">{title}</p>
      <p className="text-sm font-medium text-slate-500">{desc}</p>
    </button>
  );
}

function HomeDashboard({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const { farmerName, locationName } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl shadow-lg p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Leaf className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-block bg-white/20 text-white backdrop-blur-sm px-4 py-1.5 rounded-full font-medium text-sm mb-6 border border-white/20">
              Welcome Back
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              {farmerName || 'Farmer'}
            </h1>
            <p className="text-lg font-medium text-emerald-50 mt-4 flex items-center gap-2">
              <Map className="w-5 h-5 opacity-80" /> {locationName}
            </p>
          </div>
          
          <div className="flex gap-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shrink-0">
            <div className="text-center pr-6 border-r border-white/20">
              <Sun className="w-8 h-8 mx-auto text-amber-300 mb-2" />
              <p className="font-bold text-3xl text-white">34°</p>
            </div>
            <div className="text-center pl-2">
              <CloudRain className="w-8 h-8 mx-auto text-blue-300 mb-2" />
              <p className="font-bold text-3xl text-white">45%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Thermometer className="w-6 h-6" />} label="Soil Temp" value="29" unit="°C" color="" />
        <StatCard icon={<Droplets className="w-6 h-6 text-blue-600" />} label="Moisture" value="62" unit="%" color="" />
        <StatCard icon={<AlertTriangle className="w-6 h-6 text-amber-500" />} label="Pest Risk" value="MED" unit="" color="" />
        <StatCard icon={<CloudRain className="w-6 h-6 text-sky-500" />} label="Rain Risk" value="45" unit="%" color="" />
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <QuickCard icon={Zap} title="Crop Simulator" desc="What-if yield scenarios" colorClass="bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white" onClick={() => onTabChange('simulator')} />
          <QuickCard icon={TrendingUp} title="Mandi Optimizer" desc="Market price analysis" colorClass="bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" onClick={() => onTabChange('mandi')} />
          <QuickCard icon={Camera} title="Field Upload" desc="Scan crop photos" colorClass="bg-blue-100 text-blue-600 group-hover:bg-blue-500 group-hover:text-white" onClick={() => onTabChange('uploader')} />
          <QuickCard icon={CloudRain} title="Climate Card" desc="14-day & 40-yr forecast" colorClass="bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white" onClick={() => onTabChange('climate')} />
          <QuickCard icon={Map} title="Pest Radar" desc="Live disease spread map" colorClass="bg-rose-100 text-rose-600 group-hover:bg-rose-500 group-hover:text-white" onClick={() => onTabChange('map')} />
          <Link href="/time-machine" className="group bg-white border border-slate-100 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1 block">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white">
              <Clock className="w-7 h-7" />
            </div>
            <p className="text-xl font-bold text-slate-800 leading-tight mb-2">Time Machine</p>
            <p className="text-sm font-medium text-slate-500">Historical Baselines</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':      return <HomeDashboard onTabChange={setActiveTab} />;
      case 'simulator': return <WhatIfSimulator />;
      case 'climate':   return <RituRakhokCard />;
      case 'doctor':    return <VoiceDoctorUI />;
      case 'map':       return <PestRadarMap />;
      case 'uploader':  return <FieldUploader />;
      case 'mandi':     return <MandiOptimizer />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <AuthModal />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 z-40 w-72 border-r border-slate-200 bg-white">
        <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-10 pb-32 lg:pb-12">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
