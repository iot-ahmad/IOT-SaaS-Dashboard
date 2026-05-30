import { getEnterpriseRole, ENTERPRISE_ROLES } from './config/roles';
import { EnterpriseProvider } from './context/EnterpriseContext';
import EnterpriseShell from './components/EnterpriseShell';
import CommandHeader from './components/CommandHeader';
import SuperAdminDashboard from './dashboard/SuperAdminDashboard';
import TransportPanel from './transport/TransportPanel';
import HealthcarePanel from './healthcare/HealthcarePanel';
import TourismPanel from './tourism/TourismPanel';
import SafetyPanel from './safety/SafetyPanel';
import KpiCard from './components/KpiCard';
import { Bus, Thermometer, ShieldAlert, Flame } from 'lucide-react';
import { useEnterprise } from './context/EnterpriseContext';

function SectorDashboard({ role, user, logout }) {
  const { kpis } = useEnterprise();

  const config = {
    [ENTERPRISE_ROLES.TRANSPORT]: {
      title: 'Fleet Operations',
      subtitle: 'إدارة حركة الحافلات · وزارة النقل',
      kpi: { icon: Bus, data: kpis.transport, title: 'كفاءة الأسطول' },
      Panel: TransportPanel,
    },
    [ENTERPRISE_ROLES.HEALTHCARE]: {
      title: 'Cold Chain Monitor',
      subtitle: 'سلسلة التبريد والأدوية · وزارة الصحة',
      kpi: { icon: Thermometer, data: kpis.healthcare, title: 'استقرار التبريد' },
      Panel: HealthcarePanel,
    },
    [ENTERPRISE_ROLES.TOURISM]: {
      title: 'Petra Geofencing',
      subtitle: 'الأسوار الافتراضية · هيئة السياحة',
      kpi: { icon: ShieldAlert, data: kpis.tourism, title: 'امتثال الأسوار' },
      Panel: TourismPanel,
    },
    [ENTERPRISE_ROLES.SAFETY]: {
      title: 'Incident Response',
      subtitle: 'السلامة والطوارئ · الدفاع المدني',
      kpi: { icon: Flame, data: kpis.safety, title: 'جاهزية الطوارئ' },
      Panel: SafetyPanel,
    },
  }[role];

  if (!config) return null;
  const { Panel } = config;
  const KpiIcon = config.kpi.icon;

  return (
    <EnterpriseShell>
      <CommandHeader user={user} role={role} logout={logout} title={config.title} subtitle={config.subtitle} />
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-xl">
        <KpiCard icon={KpiIcon} title={config.kpi.title} kpi={config.kpi.data} iconClass="text-blue-400" />
      </section>
      <Panel />
    </EnterpriseShell>
  );
}

function EnterpriseRouter({ user, logout }) {
  const role = getEnterpriseRole(user);

  if (role === ENTERPRISE_ROLES.SUPER_ADMIN) {
    return (
      <EnterpriseShell>
        <CommandHeader user={user} role={role} logout={logout} subtitle="مركز التحكم الموحد · جميع القطاعات" />
        <SuperAdminDashboard />
      </EnterpriseShell>
    );
  }

  return <SectorDashboard role={role} user={user} logout={logout} />;
}

export default function EnterpriseApp({ user, logout }) {
  return (
    <EnterpriseProvider>
      <EnterpriseRouter user={user} logout={logout} />
    </EnterpriseProvider>
  );
}
