import { Bus, Battery, Users } from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import SectorTerminal from '../components/SectorTerminal';

export default function TransportPanel({ showTerminal = true }) {
  const { buses, appendLog } = useEnterprise();

  const broadcastDrivers = () => {
    appendLog('transport', 'Broadcast: Schedule compliance reminder sent to all Irbid–Amman drivers.');
    alert('تم إرسال تنبيه الالتزام بالجدول الزمني لجميع سائقي أسطول إربد - عمان.');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Bus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">إدارة حركة الحافلات</h3>
              <p className="text-[11px] text-slate-500">أسطول إربد - عمان · GPS · Battery · Occupancy</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
            Live Feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="pb-3 text-right">الحافلة</th>
                <th className="pb-3">المسار</th>
                <th className="pb-3">السائق</th>
                <th className="pb-3">البطارية</th>
                <th className="pb-3">السرعة</th>
                <th className="pb-3">الركاب</th>
                <th className="pb-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {buses.map((bus) => (
                <tr key={bus.id} className="text-slate-300 hover:bg-slate-900/20 transition-colors">
                  <td className="py-3 text-right font-bold text-white">{bus.id}</td>
                  <td className="py-3 font-sans text-right">{bus.route}</td>
                  <td className="py-3 font-sans text-right">{bus.driver}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <Battery size={13} className={bus.battery < 20 ? 'text-red-400' : 'text-emerald-400'} />
                      <span className={bus.battery < 20 ? 'text-red-400 font-bold' : ''}>{bus.battery}%</span>
                    </div>
                  </td>
                  <td className="py-3">{bus.speed} km/h</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-500" />
                      {bus.passengers}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        bus.status === 'On Route'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                          : bus.status === 'Charging'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={broadcastDrivers}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          📣 بث تنبيه عام للسائقين
        </button>
      </div>

      {showTerminal && <SectorTerminal sector="transport" />}
    </div>
  );
}
