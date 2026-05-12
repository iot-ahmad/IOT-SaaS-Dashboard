import React from 'react';
import { Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings } from 'lucide-react';
import { WORKSPACES, TOOLS } from '../data/mockData';

const iconMap = {
  Home: Home,
  Tractor: Tractor,
  Briefcase: Briefcase,
  Cpu: Cpu,
  Zap: Zap,
  Bell: Bell,
  Settings: Settings
};

export default function Sidebar({ activeWorkspace, setActiveWorkspace, activeTool, setActiveTool }) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#0F1115]/80 backdrop-blur-md border-r border-white/5 p-6 flex flex-col gap-8 z-10 hidden md:flex">
      <div>
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Workspaces</h2>
        <div className="space-y-2">
          {WORKSPACES.map(ws => {
            const Icon = iconMap[ws.icon];
            const isActive = activeWorkspace === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-primary/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                <span className="font-medium text-sm">{ws.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Tools</h2>
        <div className="space-y-2">
          {TOOLS.map(tool => {
            const Icon = iconMap[tool.icon];
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-primary/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : ''} />
                <span className="font-medium text-sm">{tool.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20">
           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">A</span>
           </div>
           <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-white">Admin User</span>
              <span className="text-xs text-white/50">Pro Plan</span>
           </div>
        </div>
      </div>
    </aside>
  );
}
