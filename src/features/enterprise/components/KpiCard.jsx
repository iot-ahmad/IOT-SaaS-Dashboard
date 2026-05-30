import { ArrowUpRight } from 'lucide-react';

export default function KpiCard({ icon: Icon, title, kpi, iconClass = 'text-blue-400', onClick }) {
  const warn = kpi?.warn;
  const pct = kpi?.value ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-right w-full bg-slate-900/30 border rounded-2xl p-5 transition-all cursor-pointer hover:scale-[1.02] ${
        warn ? 'border-amber-500/40 hover:border-amber-500/60' : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
        <span>{title}</span>
        {Icon && <Icon size={14} className={iconClass} />}
      </div>
      <div className={`text-2xl font-black mt-2 ${warn ? 'text-amber-400' : 'text-white'}`}>{pct}%</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{kpi?.label}</div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${warn ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className={`text-[10px] mt-2 flex items-center gap-1 justify-end ${warn ? 'text-amber-400' : 'text-emerald-400'}`}>
        <span>{kpi?.sub}</span>
        <ArrowUpRight size={10} />
      </div>
    </button>
  );
}
