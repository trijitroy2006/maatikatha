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
  Droplets, Thermometer, Wind, AlertTriangle, Camera, Clock
} from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode; label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className={cn("border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between min-h-[140px]", color)}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-black text-sm uppercase tracking-widest text-black">{label}</span>
        {icon}
      </div>
      <div>
        <p className="text-4xl font-black text-black">
          {value}<span className="text-lg font-bold ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, color, onClick }: {
  icon: any; title: string; desc: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("group border-4 border-black p-6 text-left transition-all active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", color)}
    >
      <div className="bg-white border-4 border-black w-14 h-14 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Icon className="w-8 h-8 text-black" />
      </div>
      <p className="text-2xl font-black text-black leading-tight mb-2">{title}</p>
      <p className="text-sm font-bold text-black uppercase">{desc}</p>
    </button>
  );
}

function HomeDashboard({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const { farmerName, locationName } = useAuth();

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Banner */}
      <div className="bg-[#FFD600] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-block bg-black text-white px-3 py-1 font-black uppercase text-sm mb-4 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Welcome Back
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none">
              {farmerName || 'FARMER'}
            </h1>
            <p className="text-xl font-bold text-black mt-4 flex items-center gap-2">
              <Map className="w-6 h-6" /> {locationName}
            </p>
          </div>
          
          <div className="flex gap-4 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <div className="text-center border-r-4 border-black pr-4">
              <Sun className="w-8 h-8 mx-auto text-orange-500 mb-1" />
              <p className="font-black text-2xl text-black">34°</p>
            </div>
            <div className="text-center">
              <CloudRain className="w-8 h-8 mx-auto text-blue-500 mb-1" />
              <p className="font-black text-2xl text-black">45%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Thermometer className="w-8 h-8 text-black" />} label="Soil Temp"     value="29"    unit="°C"    color="bg-[#D50000] text-white" />
        <StatCard icon={<Droplets    className="w-8 h-8 text-black" />} label="Moisture"      value="62"    unit="%"     color="bg-white" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-black" />} label="Pest Risk"   value="MED"   unit=""      color="bg-[#FFD600]" />
        <StatCard icon={<CloudRain   className="w-8 h-8 text-black" />} label="Rain Risk"     value="45"    unit="%"     color="bg-white" />
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-3xl font-black text-black mb-6 uppercase border-b-4 border-black pb-2 inline-block">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <QuickCard icon={Zap}       title="CROP SIMULATOR"   desc="What-if yield scenarios"       color="bg-[#FFD600]" onClick={() => onTabChange('simulator')} />
          <QuickCard icon={TrendingUp}title="MANDI OPTIMIZER"  desc="Market price analysis"         color="bg-white" onClick={() => onTabChange('mandi')} />
          <QuickCard icon={Camera}    title="FIELD UPLOAD"     desc="Scan crop photos"              color="bg-[#FFFDE7]" onClick={() => onTabChange('uploader')} />
          <QuickCard icon={CloudRain} title="CLIMATE CARD"     desc="14-day & 40-yr forecast"       color="bg-white" onClick={() => onTabChange('climate')} />
          <QuickCard icon={Map}       title="PEST RADAR"       desc="Live disease spread"           color="bg-[#D50000]" onClick={() => onTabChange('map')} />
          <Link href="/time-machine" className="group border-4 border-black p-6 text-left transition-all active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white block">
            <div className="bg-black border-4 border-black w-14 h-14 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="w-8 h-8 text-[#FFD600]" />
            </div>
            <p className="text-2xl font-black text-black leading-tight mb-2">TIME MACHINE</p>
            <p className="text-sm font-bold text-black uppercase">Historical Baselines</p>
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
    <div className="flex min-h-screen bg-[#FFFDE7] text-black">
      <AuthModal />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 z-40">
        <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-32 lg:pb-12">
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
