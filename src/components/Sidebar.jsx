import React from 'react';
import { Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, LogOut, Gamepad2, BookOpen } from 'lucide-react';
import { WORKSPACES, TOOLS } from '../data/mockData';

const iconMap = {
  Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, Gamepad2, BookOpen
};

export default function Sidebar({ activeWorkspace, setActiveWorkspace, activeTool, setActiveTool, user, logout }) {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-black/80 backdrop-blur-md border-r border-white/5 p-6 flex flex-col gap-8 z-10 hidden md:flex">
      <div>
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Workspaces</h2>
        <div className="space-y-1.5">
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
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : ''} />
                <span className="font-medium text-sm truncate">{ws.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Tools</h2>
        <div className="space-y-1.5">
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
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary' : ''} />
                <span className="font-medium text-sm">{tool.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20">
           <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
           </div>
           <div className="flex flex-col text-left min-w-0">
              <span className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</span>
              <span className="text-xs text-white/50 truncate">{user?.email}</span>
           </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm border border-transparent"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
