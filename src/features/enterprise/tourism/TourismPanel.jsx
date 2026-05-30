import { ShieldAlert, Shield, Volume2 } from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import SectorTerminal from '../components/SectorTerminal';

export default function TourismPanel({ showTerminal = true }) {
  const { geofenceAlerts, sirenActive, triggerSirenBroadcast } = useEnterprise();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">مراقبة الأسوار الافتراضية · البترا</h3>
              <p className="text-[11px] text-slate-500">Geofencing · Cliff zones · Tourist safety</p>
            </div>
          </div>
          <button
            type="button"
            onClick={triggerSirenBroadcast}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
              sirenActive ? 'bg-red-500 text-black border-red-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Volume2 size={12} />
            <span>{sirenActive ? 'سارينة نشطة' : 'بث سارينة المنطقة'}</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {geofenceAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border bg-slate-950/60 p-4 rounded-2xl flex justify-between items-center ${
                alert.severity === 'High'
                  ? 'border-red-500/30'
                  : alert.severity === 'Medium'
                    ? 'border-amber-500/30'
                    : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 text-right">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.severity === 'High'
                      ? 'bg-red-500/10 text-red-400'
                      : alert.severity === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Shield size={16} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {alert.time} · {alert.id}
                  </span>
                  <span className="text-xs font-bold text-slate-200 block mt-0.5">{alert.location}</span>
                  <p className="text-[10px] text-slate-400 mt-1">{alert.tourist}</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                  alert.severity === 'High'
                    ? 'bg-red-500/10 text-red-400'
                    : alert.severity === 'Medium'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                }`}
              >
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showTerminal && <SectorTerminal sector="tourism" />}
    </div>
  );
}
