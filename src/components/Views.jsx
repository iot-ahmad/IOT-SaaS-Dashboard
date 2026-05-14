import React, { useState } from 'react';
import { 
  SoilMoistureCard, 
  IrrigationValveCard, 
  WaterTankCard, 
  GreenhouseTempCard, 
  AutomationsCard 
} from './Cards';
import ESP32Model from './ESP32Model';
import { Lightbulb, Wind, ShieldCheck, Zap, Users, Thermometer, Briefcase, Plus, X, Gamepad2 } from 'lucide-react';

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

export const HomeView = ({ workspaces, onAddWorkspace, setActiveWorkspace }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEsp32, setNewEsp32] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddWorkspace(newName.trim(), newEsp32.trim());
      setNewName('');
      setNewEsp32('');
      setShowAddModal(false);
    }
  };

  const customWorkspaces = workspaces?.filter(ws => ws.isCustom) || [];

  return (
    <div className="relative min-h-[600px] w-full">
      <ESP32Model />
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Projects</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span>Add Project</span>
          </button>
        </div>

        {customWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Gamepad2 size={32} className="text-slate-400 dark:text-white/20" />
             </div>
             <h3 className="text-xl font-bold text-slate-700 dark:text-white/60">No Projects Yet</h3>
             <p className="text-slate-500 dark:text-white/40 mt-2 max-w-sm">Create your first project to start monitoring and controlling your ESP32 devices.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customWorkspaces.map(ws => (
              <button 
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className="text-left bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-primary/50 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Gamepad2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{ws.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/40 mt-1">
                        {ws.esp32Prefix ? `Target: ${ws.esp32Prefix}` : 'Universal Control'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0b0d] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Project</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Project Name</label>
                <input 
                  autoFocus
                  required
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Smart Car, Weather Station..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">ESP32 Target UID (Optional)</label>
                <input 
                  value={newEsp32} 
                  onChange={e => setNewEsp32(e.target.value)}
                  placeholder="e.g. ESP_A1B2C3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm"
                />
                <p className="text-[10px] text-white/30 mt-1">If provided, widgets in this project will automatically target this specific ESP32.</p>
              </div>
              <button type="submit" className="w-full bg-primary text-black font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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
