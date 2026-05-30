/** @typedef {'super_admin' | 'transport' | 'healthcare' | 'tourism' | 'safety'} EnterpriseRole */
/** @typedef {'transport' | 'healthcare' | 'tourism' | 'safety' | 'system'} LogSector */

export const ENTERPRISE_ROLES = /** @type {const} */ ({
  SUPER_ADMIN: 'super_admin',
  TRANSPORT: 'transport',
  HEALTHCARE: 'healthcare',
  TOURISM: 'tourism',
  SAFETY: 'safety',
});

/** Demo accounts — each role lands on its sector dashboard only */
export const DEMO_ACCOUNTS = [
  { email: 'admin@enterprise.com', password: 'admin123', role: 'super_admin', label: 'Super Admin · Command Center' },
  { email: 'transport@iot365.gov', password: 'admin123', role: 'transport', label: 'وزارة النقل · أسطول الحافلات' },
  { email: 'health@iot365.gov', password: 'admin123', role: 'healthcare', label: 'الصحة · سلسلة التبريد' },
  { email: 'tourism@iot365.gov', password: 'admin123', role: 'tourism', label: 'السياحة · أسوار البترا' },
  { email: 'safety@iot365.gov', password: 'admin123', role: 'safety', label: 'السلامة · الطوارئ والإنذارات' },
];

/** @param {{ email?: string } | null | undefined} user */
export function getEnterpriseRole(user) {
  const email = user?.email?.toLowerCase() || '';
  const match = DEMO_ACCOUNTS.find((a) => a.email === email);
  if (match) return match.role;
  if (email.includes('transport')) return ENTERPRISE_ROLES.TRANSPORT;
  if (email.includes('health')) return ENTERPRISE_ROLES.HEALTHCARE;
  if (email.includes('tourism')) return ENTERPRISE_ROLES.TOURISM;
  if (email.includes('safety')) return ENTERPRISE_ROLES.SAFETY;
  return ENTERPRISE_ROLES.SUPER_ADMIN;
}

/** @param {EnterpriseRole} role */
export function getRoleLabel(role) {
  const labels = {
    super_admin: 'Super Admin · Command Center',
    transport: 'وزارة النقل · Fleet Ops',
    healthcare: 'وزارة الصحة · Cold Chain',
    tourism: 'هيئة السياحة · Geofencing',
    safety: 'الدفاع المدني · Incident Response',
  };
  return labels[role] || labels.super_admin;
}

/** @param {EnterpriseRole} role @param {LogSector | 'all'} sector */
export function canAccessSector(role, sector) {
  if (role === ENTERPRISE_ROLES.SUPER_ADMIN || sector === 'all') return role === ENTERPRISE_ROLES.SUPER_ADMIN;
  return role === sector;
}
