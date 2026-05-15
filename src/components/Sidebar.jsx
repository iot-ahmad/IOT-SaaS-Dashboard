import React, { useState } from 'react';
import { Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, LogOut, Gamepad2, BookOpen, Plus, X, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';
import { TOOLS } from '../data/mockData';

const iconMap = {
  Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, Gamepad2, BookOpen, LayoutDashboard
};

export default function Sidebar({ workspaces, activeWorkspace, setActiveWorkspace, activeTool, setActiveTool, user, logout, onAddWorkspace }) {
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
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md border-r border-slate-200 dark:border-white/5 p-6 flex flex-col gap-8 z-10 hidden md:flex">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-600 dark:text-white/40 text-xs font-semibold uppercase tracking-wider">Workspaces</h2>
          <button onClick={() => setShowAddModal(true)} className="text-slate-500 hover:text-primary transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-1.5">
          {workspaces?.map(ws => {
            const Icon = iconMap[ws.icon];
            const isActive = activeWorkspace === ws.id;
            return (
              <Button
                key={ws.id}
                type="button"
                onClick={() => setActiveWorkspace(ws.id)}
                variant={isActive ? 'navActive' : 'nav'}
                size="nav"
                neon={isActive}
                className="flex items-center"
              >
                {Icon ? <Icon size={18} className={isActive ? 'text-blue-400 shrink-0' : 'shrink-0'} /> : <Gamepad2 size={18} className={isActive ? 'text-blue-400 shrink-0' : 'shrink-0'} />}
                <span className="truncate">{ws.name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-slate-600 dark:text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Tools</h2>
        <div className="space-y-1.5">
          {TOOLS.map(tool => {
            const Icon = iconMap[tool.icon];
            const isActive = activeTool === tool.id;
            return (
              <Button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                variant={isActive ? 'navActive' : 'nav'}
                size="nav"
                neon={isActive}
                className="flex items-center"
              >
                <Icon size={18} className={isActive ? 'text-blue-400 shrink-0' : 'shrink-0'} />
                <span>{tool.name}</span>
              </Button>
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
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</span>
              <span className="text-xs text-slate-600 dark:text-white/50 truncate">{user?.email}</span>
           </div>
        </div>
        <Button
          type="button"
          onClick={logout}
          variant="destructive"
          size="sm"
          neon={false}
          className="flex items-center justify-start gap-3 rounded-xl py-2.5 text-sm font-normal"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </Button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0b0d] border border-white/10 p-6 rounded-2xl w-full max-w-sm relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Dashboard</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Dashboard Name</label>
                <input 
                  autoFocus
                  required
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Living Room, Garage..."
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
                <p className="text-[10px] text-white/30 mt-1">If provided, widgets in this dashboard will automatically target this specific ESP32.</p>
              </div>
              <Button type="submit" variant="solid" neon={false} size="block" className="w-full rounded-xl">
                Create Dashboard
              </Button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
