# Enterprise SaaS Architecture

Feature-based structure with **role-based dashboards** (multi-tenancy demo).

## Folder layout

```
src/features/enterprise/
├── config/roles.js          # Roles + demo accounts
├── context/EnterpriseContext.jsx  # Shared MQTT/sim state + sector logs
├── components/              # Shell, Header, KpiCard, SectorTerminal
├── dashboard/               # Super Admin (all sectors)
├── transport/               # Fleet only
├── healthcare/              # Cold chain only
├── tourism/                 # Geofencing only
├── safety/                  # Incident response workflow
└── EnterpriseApp.jsx        # Role router
```

## Demo accounts (password: `admin123`)

| Email | Dashboard |
|-------|-----------|
| admin@enterprise.com | Super Admin · all sectors + unified terminal |
| transport@iot365.gov | Buses only · fleet terminal |
| health@iot365.gov | Fridges only · cold chain terminal |
| tourism@iot365.gov | Petra geofencing only |
| safety@iot365.gov | Fire/O2 · incident workflow |

## Terminals

- **Super Admin / all sectors:** unified log at bottom
- **Each sector tab or role:** filtered terminal (no cross-sector noise)
