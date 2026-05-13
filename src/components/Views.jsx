import React from 'react';
import { 
  SoilMoistureCard, 
  IrrigationValveCard, 
  WaterTankCard, 
  GreenhouseTempCard, 
  AutomationsCard 
} from './Cards';
import { Lightbulb, Wind, ShieldCheck, Zap, Users, Thermometer, Briefcase } from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-300 dark:border-white/20 group ${className}`}>
    {children}
  </div>
);

export const FarmView = ({ deviceStates, publish }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SoilMoistureCard deviceStates={deviceStates} publish={publish} />
      <IrrigationValveCard deviceStates={deviceStates} publish={publish} />
      <WaterTankCard deviceStates={deviceStates} />
      <GreenhouseTempCard deviceStates={deviceStates} />
    </div>
    <div className="grid grid-cols-1 gap-6">
      <AutomationsCard publish={publish} />
    </div>
  </div>
);

export const HomeView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-yellow-400">
              <Lightbulb size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Smart Lighting</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">8 Active</span>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-white/50">Living Room</span><span className="text-primary">ON</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-white/50">Kitchen</span><span className="text-slate-500 dark:text-white/30">OFF</span></div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <Wind size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Climate Control</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">22.5°C</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full mt-4"><div className="bg-blue-400 h-full rounded-full" style={{width: '65%'}}></div></div>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <ShieldCheck size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Security</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Armed</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-white/50 mt-4">All entries secured. Last activity: 2m ago.</p>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-purple-400">
              <Zap size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Power Usage</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">1.2 kW/h</span>
          </div>
        </div>
        <p className="text-xs text-emerald-400 mt-4">↓ 15% lower than average</p>
      </Card>
    </div>
  </div>
);

export const OfficeView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-orange-400">
              <Users size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Occupancy</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">14 People</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-white/50 mt-4">Meeting Room A: Occupied</p>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-teal-400">
              <Thermometer size={20} />
              <h3 className="text-slate-800 dark:text-white/80 font-medium">Air Quality</h3>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Excellent</span>
          </div>
        </div>
        <p className="text-xs text-teal-400 mt-4">CO2: 420 ppm</p>
      </Card>

      <Card className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-slate-600 dark:text-white/40" size={20} />
          <h3 className="text-slate-800 dark:text-white/80 font-medium">Desk Bookings</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${i < 5 ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20'}`}>
              D{i}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
