import { Thermometer, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SectorTerminal from '../components/SectorTerminal';
import { useEnterprise } from '../context/EnterpriseContext';

export default function HealthcarePanel({ showTerminal = true }) {
  const { fridges, fridgeAlertActive, fridgeHistoryData, muteFridgeAlert } = useEnterprise();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Thermometer size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">سلسلة التبريد والأكسجين</h3>
            <p className="text-[11px] text-slate-500">ثلاجات اللقاحات · مخازن الأدوية الحيوية</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {fridges.map((f) => {
            const isC3 = f.id === 'FRIDGE-C3';
            const isCritical = f.status === 'Critical' && fridgeAlertActive;
            return (
              <div
                key={f.id}
                className={`border rounded-2xl p-4 transition-all ${
                  isCritical
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">{f.id}</span>
                      <span className="text-[10px] text-slate-500">({f.type})</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">{f.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isCritical ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {isCritical ? 'ALARM' : 'STABLE'}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block">Target</span>
                    <span className="text-[10px] text-slate-300 font-mono">{f.range}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 font-mono block">Temp</span>
                    <span className={`text-2xl font-black font-mono ${isCritical ? 'text-rose-400' : 'text-slate-100'}`}>{f.temp}°C</span>
                  </div>
                </div>
                {isC3 && isCritical && (
                  <button
                    type="button"
                    onClick={muteFridgeAlert}
                    className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>تأكيد وكتم إنذار الحرارة</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 block">منحنى FRIDGE-C3</span>
          <div className="h-32 w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fridgeHistoryData} margin={{ top: 2, right: 2, left: -25, bottom: 2 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="time" fontSize={8} stroke="#ffffff30" />
                <YAxis fontSize={8} stroke="#ffffff30" domain={[2, 16]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showTerminal && <SectorTerminal sector="healthcare" />}
    </div>
  );
}
