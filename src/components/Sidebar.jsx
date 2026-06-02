import React, { useState } from 'react';
import { Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, LogOut, Gamepad2, BookOpen, Plus, X, LayoutDashboard, ChevronLeft, ChevronRight, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';
import { TOOLS } from '../data/mockData';

const iconMap = {
  Home, Tractor, Briefcase, Cpu, Zap, Bell, Settings, Gamepad2, BookOpen, LayoutDashboard
};

const navBtnClass =
  'mx-0 w-full flex items-center justify-start gap-3 rounded-xl text-sm font-medium';

export default function Sidebar({
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  activeTool,
  setActiveTool,
  user,
  logout,
  onAddWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  isCollapsed,
  onToggleCollapse,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEsp32, setNewEsp32] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddWorkspace(newName.trim(), newEsp32.trim());
      setNewName('');
      setNewEsp32('');
      setShowAddModal(false);
    }
  };

  const startRename = (ws) => {
    setRenamingId(ws.id);
    setRenameValue(ws.name);
  };

  const commitRename = (id) => {
    if (renameValue.trim()) onRenameWorkspace(id, renameValue.trim());
    setRenamingId(null);
  };

  return (
    <aside className="w-full h-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-r border-slate-200 dark:border-white/5 flex flex-col gap-6 overflow-hidden relative">

      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex absolute top-4 right-[-12px] z-50 w-6 h-6 rounded-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 items-center justify-center text-slate-500 dark:text-white/50 hover:text-primary hover:border-primary/40 transition-all shadow-md"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand Logo */}
      <div className={`px-4 pt-5 pb-3 flex items-center gap-3 border-b border-slate-100 dark:border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
        <img src="/logo_icon.png" alt="IOT365 Icon" className="w-8 h-8 object-contain flex-shrink-0" />
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">IOT365</span>
            <span className="text-[9px] text-slate-500 dark:text-white/30 uppercase tracking-widest font-semibold truncate">Dashboard</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 flex-1 overflow-y-auto p-4 pt-2">

        {/* WORKSPACES */}
        <div>
          <div className={`flex items-center mb-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <h2 className="text-slate-600 dark:text-white/40 text-xs font-semibold uppercase tracking-wider">Workspaces</h2>
            )}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Add workspace"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1.5">
            {workspaces?.map(ws => {
              const Icon = iconMap[ws.icon];
              const isActive = activeWorkspace === ws.id;
              const isRenaming = renamingId === ws.id;

              return (
                <div key={ws.id} className="group relative">
                  {isRenaming ? (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 border border-primary/40 rounded-xl px-2 py-1.5">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(ws.id); if (e.key === 'Escape') setRenamingId(null); }}
                        className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white min-w-0"
                      />
                      <button onClick={() => commitRename(ws.id)} className="text-primary hover:text-primary/70 flex-shrink-0">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setActiveWorkspace(ws.id)}
                      variant={isActive ? 'default' : 'ghost'}
                      neon={isActive}
                      className={`${navBtnClass} ${isCollapsed ? 'justify-center px-2' : ''} pr-2`}
                      title={isCollapsed ? ws.name : ''}
                    >
                      {Icon ? <Icon size={18} className="shrink-0" /> : <Gamepad2 size={18} className="shrink-0" />}
                      {!isCollapsed && <span className="truncate flex-1 text-left">{ws.name}</span>}

                      {/* Rename + Delete — only on custom workspaces, only when not collapsed */}
                      {!isCollapsed && ws.isCustom && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); startRename(ws); }}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title="Rename"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); onDeleteWorkspace(ws.id); }}
                            className="p-1 rounded-md hover:bg-red-500/10 text-slate-400 dark:text-white/30 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TOOLS */}
        <div>
          {!isCollapsed && (
            <h2 className="text-slate-600 dark:text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Tools</h2>
          )}
          <div className="space-y-1.5">
            {TOOLS.map(tool => {
              const Icon = iconMap[tool.icon];
              const isActive = activeTool === tool.id;
              return (
                <Button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  variant={isActive ? 'default' : 'ghost'}
                  neon={isActive}
                  className={`${navBtnClass} ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? tool.name : ''}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span>{tool.name}</span>}
                </Button>
              );
            })}
          </div>
        </div>



        {/* USER + SIGN OUT */}
        <div className="mt-auto space-y-3 pt-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-700 dark:text-white font-bold text-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</span>
                <span className="text-xs text-slate-500 dark:text-white/50 truncate">{user?.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center" title={user?.displayName || 'User'}>
                <span className="text-slate-700 dark:text-white font-bold text-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={logout}
            variant="ghost"
            neon={false}
            className={`${navBtnClass} text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Add Workspace Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-sm relative text-slate-900 dark:text-white shadow-2xl">
            <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Dashboard</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Dashboard Name</label>
                <input
                  autoFocus
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Living Room, Garage..."
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">ESP32 Target UID (Optional)</label>
                <input
                  value={newEsp32}
                  onChange={e => setNewEsp32(e.target.value)}
                  placeholder="e.g. ESP_A1B2C3"
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 text-sm text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">If provided, widgets in this dashboard will automatically target this specific ESP32.</p>
              </div>
              <Button type="submit" variant="solid" className="w-full mx-0 rounded-xl">
                Create Dashboard
              </Button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
