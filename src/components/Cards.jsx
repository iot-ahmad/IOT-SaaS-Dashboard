import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Waves, Power, Settings2 } from 'lucide-react';
import { SOIL_MOISTURE_DATA, AUTOMATIONS } from '../data/mockData';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 group ${className}`}>
    {children}
  </div>
);

export const SoilMoistureCard = ({ deviceStates, publish }) => {
  const liveValue = deviceStates?.['farm/soil_moisture'];
  const displayValue = liveValue || '44';

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-2">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="text-blue-400" size={20} />
            <h3 className="text-white/80 font-medium">Soil Moisture</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{displayValue}%</span>
            <span className="text-emerald-400 text-sm font-medium mb-1">+2% from yesterday</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <Droplets className="text-blue-400" size={20} />
        </div>
      </div>
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={SOIL_MOISTURE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F1115', borderColor: '#ffffff20', borderRadius: '8px' }}
              itemStyle={{ color: '#10B981' }}
            />
            <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10B981', stroke: '#0F1115', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export const IrrigationValveCard = ({ deviceStates, publish }) => {
  const liveState = deviceStates?.['farm/irrigation'];
  const [isOn, setIsOn] = useState(false);
  const currentState = liveState !== undefined ? liveState === '1' : isOn;

  const handleToggle = () => {
    const newState = !currentState;
    setIsOn(newState);
    if (publish) publish('farm/irrigation', newState ? '1' : '0');
  };

  return (
    <Card className="flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Power className={currentState ? "text-primary" : "text-white/40"} size={20} />
            <h3 className="text-white/80 font-medium">Main Valve</h3>
          </div>
          <span className={`text-2xl font-bold ${currentState ? 'text-primary' : 'text-white/40'}`}>
            {currentState ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <button 
          onClick={handleToggle}
          className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${currentState ? 'bg-primary' : 'bg-white/20'}`}
        >
          <div className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 ${currentState ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-white/50 mb-1">Next Scheduled Run</p>
        <p className="text-sm font-medium text-white">Today, 18:00 (in 4h 20m)</p>
      </div>
    </Card>
  );
};

export const WaterTankCard = ({ deviceStates }) => {
  const liveLevel = deviceStates?.['farm/water_tank'];
  const level = liveLevel ? parseInt(liveLevel) : 75;
  
  return (
    <Card className="flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full flex justify-between items-start mb-6 absolute top-6 left-6 right-6">
        <div className="flex items-center gap-2">
          <Waves className="text-cyan-400" size={20} />
          <h3 className="text-white/80 font-medium">Water Tank</h3>
        </div>
      </div>
      
      <div className="relative w-32 h-32 mt-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="56" className="stroke-white/10" strokeWidth="12" fill="none" />
          <circle 
            cx="64" cy="64" r="56" 
            className="stroke-cyan-400 transition-all duration-1000 ease-out" 
            strokeWidth="12" fill="none" 
            strokeDasharray="351.8" 
            strokeDashoffset={351.8 - (351.8 * level) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-2xl font-bold text-white">{level}%</span>
        </div>
      </div>
      <p className="text-xs text-white/50 mt-4">Capacity: 10,000L</p>
    </Card>
  );
};

export const GreenhouseTempCard = ({ deviceStates }) => {
  const liveTemp = deviceStates?.['farm/greenhouse_temp'];
  const temp = liveTemp || '28.5';

  return (
    <Card className="flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="text-rose-400" size={20} />
            <h3 className="text-white/80 font-medium">Greenhouse Temp</h3>
          </div>
          <span className="text-5xl font-bold text-white">{temp}°</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/50 mb-2">
          <span>Min: 18°</span>
          <span>Target: 24°</span>
          <span>Max: 32°</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
           <div className="h-full bg-blue-400" style={{ width: '25%' }}></div>
           <div className="h-full bg-primary" style={{ width: '40%' }}></div>
           <div className="h-full bg-rose-400" style={{ width: '35%' }}></div>
        </div>
        <div className="relative w-full h-2 -mt-2">
           <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all" style={{ left: '60%' }}></div>
        </div>
      </div>
    </Card>
  );
};

export const AutomationsCard = ({ publish }) => {
  const [autos, setAutos] = useState(AUTOMATIONS);

  const toggleAuto = (id) => {
    setAutos(autos.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Settings2 className="text-purple-400" size={20} />
          <h3 className="text-white/80 font-medium">Active Automations</h3>
        </div>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
          + Add New Rule
        </button>
      </div>
      <div className="space-y-3">
        {autos.map(auto => (
          <div key={auto.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <p className={`text-sm ${auto.active ? 'text-white' : 'text-white/40'}`}>{auto.rule}</p>
            <button 
              onClick={() => toggleAuto(auto.id)}
              className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${auto.active ? 'bg-primary' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${auto.active ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
