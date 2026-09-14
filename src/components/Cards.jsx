import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Thermometer, Waves, Power, Settings2 } from 'lucide-react';
import { SOIL_MOISTURE_DATA, AUTOMATIONS } from '../data/mockData';

const Card = ({ children, className = '' }) => (
  <div style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)', borderRadius: 'var(--radius)' }}
    className={`border p-6 transition-all duration-200 group ${className}`}>
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
            <Droplets className="icon-muted" size={20} />
            <h3 style={{ color: 'var(--card-foreground)' }} className="font-medium">Soil Moisture</h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ color: 'var(--foreground)' }} className="text-4xl font-bold">{displayValue}%</span>
            <span className="text-muted-foreground text-sm font-medium mb-1">+2% from yesterday</span>
          </div>
        </div>
        <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} className="w-10 h-10 flex items-center justify-center transition-colors">
          <Droplets className="icon-muted" size={20} />
        </div>
      </div>
      <div className="h-[120px] -mx-6 w-[calc(100%+3rem)] sm:w-full sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={SOIL_MOISTURE_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d23', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
              itemStyle={{ color: '#e8e9eb' }}
            />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 }} />
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
            <Power className="icon-muted" size={20} />
            <h3 style={{ color: 'var(--card-foreground)' }} className="font-medium">Main Valve</h3>
          </div>
          <span style={{ color: currentState ? 'var(--status-on)' : 'var(--muted-foreground)' }} className="text-2xl font-bold font-mono">
            {currentState ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <button
          onClick={handleToggle}
          style={{ background: currentState ? 'var(--status-on)' : 'var(--muted)', borderRadius: 'var(--radius)', transition: 'background 0.2s' }}
          className="w-14 h-8 p-1 cursor-pointer border border-border"
        >
          <div style={{ background: '#ffffff', borderRadius: 'calc(var(--radius) - 4px)' }} className={`w-6 h-6 transition-transform duration-200 ${currentState ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} className="mt-4 p-3">
        <p style={{ color: 'var(--muted-foreground)' }} className="text-xs mb-1">Next Scheduled Run</p>
        <p style={{ color: 'var(--foreground)' }} className="text-sm font-medium">Today, 18:00 (in 4h 20m)</p>
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
          <Waves className="icon-muted" size={20} />
          <h3 style={{ color: 'var(--card-foreground)' }} className="font-medium">Water Tank</h3>
        </div>
      </div>
      
      <div className="relative w-32 h-32 mt-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="56" stroke="var(--border)" strokeWidth="10" fill="none" />
          <circle
            cx="64" cy="64" r="56"
            stroke="var(--primary)"
            className="transition-all duration-700 ease-out"
            strokeWidth="10" fill="none"
            strokeDasharray="351.8" 
            strokeDashoffset={351.8 - (351.8 * level) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-2xl font-bold font-mono text-foreground">{level}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Capacity: 10,000L</p>
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
            <Thermometer className="icon-muted" size={20} />
            <h3 style={{ color: 'var(--card-foreground)' }} className="font-medium">Greenhouse Temp</h3>
          </div>
          <span className="text-5xl font-bold font-mono text-foreground">{temp}°</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2 font-mono">
          <span>Min: 18°</span>
          <span>Target: 24°</span>
          <span>Max: 32°</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex border border-border">
           <div style={{ background: 'var(--primary)', width: '60%' }} className="h-full" />
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
          <Settings2 className="icon-muted" size={20} />
          <h3 style={{ color: 'var(--card-foreground)' }} className="font-medium">Active Automations</h3>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer">
          + Add New Rule
        </button>
      </div>
      <div className="space-y-3">
        {autos.map(auto => (
          <div key={auto.id} style={{ background: 'var(--muted)', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }} className="flex items-center justify-between p-4 border transition-colors">
            <p style={{ color: auto.active ? 'var(--foreground)' : 'var(--muted-foreground)' }} className="text-sm">{auto.rule}</p>
            <button
              onClick={() => toggleAuto(auto.id)}
              style={{ background: auto.active ? 'var(--status-on)' : 'var(--input)', borderRadius: 'var(--radius)', transition: 'background 0.2s' }}
              className="w-10 h-6 p-1 flex-shrink-0 cursor-pointer border border-border"
            >
              <div style={{ background: '#ffffff', borderRadius: 'calc(var(--radius) - 6px)' }} className={`w-4 h-4 transition-transform duration-200 ${auto.active ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
