import { Flame, Activity, RefreshCw, Phone, CheckCircle2, Circle } from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import SectorTerminal from '../components/SectorTerminal';

function WorkflowStep({ done, active, label }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${active ? 'border-red-500/50 bg-red-500/5' : done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/40'}`}>
      {done ? (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      ) : active ? (
        <Circle size={18} className="text-red-400 animate-pulse shrink-0" />
      ) : (
        <Circle size={18} className="text-slate-600 shrink-0" />
      )}
      <span className={`text-xs font-bold ${done ? 'text-emerald-300' : active ? 'text-red-300' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}

export default function SafetyPanel({ showTerminal = true }) {
  const {
    museumFire,
    museumTemp,
    oxygenLevel,
    oxygenAlertActive,
    fireWorkflow,
    confirmCivilDefense,
    extinguishFire,
    activateVentilation,
    simulateFire,
    setOxygenLevel,
  } = useEnterprise();

  const fireActive = museumFire || fireWorkflow.detected;

  return (
    <div className="space-y-6">
      {fireActive && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-3xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-red-300">🚨 معالج استجابة الحريق · Incident Response</h4>
          <WorkflowStep done={fireWorkflow.detected} active={false} label={`1. تم رصد الحريق (${museumTemp}°C) 🟢`} />
          <WorkflowStep done={fireWorkflow.sprinklersActive} active={false} label="2. تفعيل الرشاشات تلقائياً 🟢" />
          <WorkflowStep
            done={fireWorkflow.civilDefenseConfirmed}
            active={!fireWorkflow.civilDefenseConfirmed}
            label="3. تأكيد الاتصال بالدفاع المدني يدوياً"
          />
          {!fireWorkflow.civilDefenseConfirmed && (
            <button
              type="button"
              onClick={confirmCivilDefense}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Phone size={14} />
              <span>🔴 تأكيد استدعاء الدفاع المدني</span>
            </button>
          )}
          {fireWorkflow.civilDefenseConfirmed && (
            <button
              type="button"
              onClick={extinguishFire}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              إغلاق الحادث واستعادة الحالة الطبيعية
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`border rounded-2xl p-5 relative overflow-hidden ${fireActive ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-950/40 border-slate-800'}`}>
            {fireActive && (
              <div className="absolute -right-6 -bottom-6 opacity-10 text-red-500">
                <Flame size={120} />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Flame className={fireActive ? 'text-red-500 animate-bounce' : 'text-slate-400'} size={20} />
                <h4 className="text-sm font-bold text-white">متحف عمان الأثري</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${fireActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                {fireActive ? 'حريق نشط' : 'آمن'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-mono block">الحرارة</span>
                <span className={`text-xl font-bold font-mono ${fireActive ? 'text-red-400' : 'text-slate-300'}`}>{museumTemp}°C</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-mono block">الدخان</span>
                <span className={`text-sm font-bold ${fireActive ? 'text-red-400' : 'text-slate-300'}`}>{fireActive ? 'دخان كثيف' : 'طبيعي'}</span>
              </div>
            </div>
            {!fireActive && (
              <button type="button" onClick={simulateFire} className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-xl text-xs cursor-pointer">
                🔥 محاكاة حريق للتجربة
              </button>
            )}
          </div>

          <div className={`border rounded-2xl p-5 ${oxygenLevel < 19.5 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-950/40 border-slate-800'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Activity className={oxygenLevel < 19.5 ? 'text-amber-500 animate-pulse' : 'text-slate-400'} size={20} />
                <h4 className="text-sm font-bold text-white">مستودع الزرقاء · O2</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${oxygenLevel < 19.5 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                {oxygenLevel < 19.5 ? 'خطر' : 'طبيعي'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-mono block">O2</span>
                <span className={`text-xl font-bold font-mono ${oxygenLevel < 19.5 ? 'text-amber-400' : 'text-slate-300'}`}>{oxygenLevel}%</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-mono block">التهوية</span>
                <span className={`text-sm font-bold ${oxygenAlertActive ? 'text-emerald-400' : oxygenLevel < 19.5 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {oxygenAlertActive ? 'ضخ نشط' : oxygenLevel < 19.5 ? 'معطلة' : 'طبيعية'}
                </span>
              </div>
            </div>
            {oxygenLevel < 19.5 && !oxygenAlertActive && (
              <button type="button" onClick={activateVentilation} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <RefreshCw size={14} className="animate-spin" />
                <span>تشغيل التهوية القسرية</span>
              </button>
            )}
            {oxygenLevel >= 19.5 && (
              <button type="button" onClick={() => setOxygenLevel(17.8)} className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-400 py-2 rounded-xl text-xs cursor-pointer">
                محاكاة انخفاض O2
              </button>
            )}
          </div>
        </div>

        {showTerminal && <SectorTerminal sector="safety" />}
      </div>
    </div>
  );
}
