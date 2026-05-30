import { useEnterprise } from '../context/EnterpriseContext';

/** @typedef {import('../config/roles').LogSector} LogSector */

export default function SectorTerminal({ sector = 'all', title, className = '' }) {
  const { getLogsForSector } = useEnterprise();
  const entries = getLogsForSector(sector);

  const defaultTitle =
    sector === 'all'
      ? 'سجل عمليات النظام الموحد · جميع القطاعات'
      : sector === 'transport'
        ? 'سجل حركة الأسطول · Fleet Terminal'
        : sector === 'healthcare'
          ? 'سجل سلسلة التبريد · Cold Chain Log'
          : sector === 'tourism'
            ? 'سجل الأسوار الافتراضية · Geofence Log'
            : 'سجل الطوارئ · Incident Log';

  return (
    <div className={`bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-sm font-bold text-slate-200">{title || defaultTitle}</span>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
      </div>
      <div className="h-72 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-[11px] text-slate-400 space-y-2 overflow-y-auto leading-relaxed text-left">
        {entries.length === 0 ? (
          <span className="text-slate-600">No events in this sector yet.</span>
        ) : (
          entries.map((log, index) => (
            <div key={log.id} className="flex gap-1.5">
              <span className="text-slate-600 select-none shrink-0">[{index}]</span>
              <span
                className={
                  log.text.includes('⚠️') || log.text.includes('violation') || log.text.includes('FIRE')
                    ? 'text-rose-400'
                    : log.text.includes('Admin') || log.text.includes('Auto-response')
                      ? 'text-blue-400'
                      : 'text-slate-400'
                }
              >
                <span className="text-slate-600 text-[9px] mr-1 uppercase">[{log.sector}]</span>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <span>قناة MQTT · {sector === 'all' ? 'multi-tenant' : sector}</span>
        <span className="text-emerald-400 font-bold font-mono">active_broker_ssl</span>
      </div>
    </div>
  );
}
