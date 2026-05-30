import { Database, LogOut } from 'lucide-react';
import { getRoleLabel } from '../config/roles';
import { useEnterprise } from '../context/EnterpriseContext';

export default function CommandHeader({ user, role, logout, title = 'Command Center', subtitle }) {
  const { sysTime } = useEnterprise();

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
          <Database size={24} className="animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {title}
            </h1>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">
              {getRoleLabel(role)}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {subtitle || `مرحباً ${user?.displayName || user?.email} · IOT365 Enterprise SaaS`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-800 md:border-none pt-4 md:pt-0">
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-300 font-mono">{sysTime}</div>
          <div className="text-[10px] text-slate-500 font-mono">2026-05-30</div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span>خروج النظام</span>
        </button>
      </div>
    </header>
  );
}
