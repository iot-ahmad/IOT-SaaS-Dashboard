import { useState } from 'react';
import { Bus, Thermometer, ShieldAlert, Flame, Radio } from 'lucide-react';
import { useEnterprise } from '../context/EnterpriseContext';
import KpiCard from '../components/KpiCard';
import SectorTerminal from '../components/SectorTerminal';
import TransportPanel from '../transport/TransportPanel';
import HealthcarePanel from '../healthcare/HealthcarePanel';
import TourismPanel from '../tourism/TourismPanel';
import SafetyPanel from '../safety/SafetyPanel';

const TABS = [
  { id: 'all', label: 'جميع القطاعات' },
  { id: 'transport', label: '🚌 النقل' },
  { id: 'healthcare', label: '🏥 الصحة' },
  { id: 'tourism', label: '🗺️ السياحة' },
  { id: 'safety', label: '🚨 السلامة' },
];

export default function SuperAdminDashboard() {
  const { kpis } = useEnterprise();
  const [activeSection, setActiveSection] = useState('all');

  return (
    <>
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Bus} title="أسطول النقل" kpi={kpis.transport} iconClass="text-blue-400" onClick={() => setActiveSection('transport')} />
        <KpiCard icon={Thermometer} title="سلسلة التبريد" kpi={kpis.healthcare} iconClass="text-rose-400" onClick={() => setActiveSection('healthcare')} />
        <KpiCard icon={ShieldAlert} title="الأسوار السياحية" kpi={kpis.tourism} iconClass="text-amber-400" onClick={() => setActiveSection('tourism')} />
        <KpiCard icon={Flame} title="أنظمة السلامة" kpi={kpis.safety} iconClass="text-red-400" onClick={() => setActiveSection('safety')} />
        <KpiCard icon={Radio} title="MQTT Broker" kpi={kpis.mqtt} iconClass="text-emerald-400" />
      </section>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSection === tab.id
                ? tab.id === 'safety'
                  ? 'bg-red-500 text-black'
                  : 'bg-blue-500 text-black'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'all' && (
        <div className="space-y-6">
          <TransportPanel showTerminal={false} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <HealthcarePanel showTerminal={false} />
            <TourismPanel showTerminal={false} />
          </div>
          <SafetyPanel showTerminal={false} />
          <SectorTerminal sector="all" />
        </div>
      )}

      {activeSection === 'transport' && <TransportPanel />}
      {activeSection === 'healthcare' && <HealthcarePanel />}
      {activeSection === 'tourism' && <TourismPanel />}
      {activeSection === 'safety' && <SafetyPanel />}
    </>
  );
}
