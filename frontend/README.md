# Dayflow — Frontend

React + Vite + Tailwind CSS v4 client for the Dayflow HRMS.

Tagline: *Every workday, perfectly aligned.*

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
```

## Structure

```
src/
├── App.jsx                     # view switching (swap for a router later)
├── index.css                   # Tailwind + design tokens (@theme)
├── lib/
│   ├── status.js               # status → colour vocabulary, single source
│   └── format.js               # money, hours, initials, greeting, dates
├── data/
│   └── employeeDashboard.js    # mock shaped exactly like the API contract
├── components/
│   ├── ui/                     # Card, Badge, Button, Avatar, ProgressBar
│   └── dashboard/              # TodayCard, QuickActions, WeekStrip,
│                               # LeaveSummary, PayrollCard, ProfileCard,
│                               # ActivityFeed
├── layout/                     # AppShell, Sidebar, Topbar
└── pages/
    └── EmployeeDashboard.jsx   # composition only, no markup of its own
```

## Design system

All colour, type and elevation live in `src/index.css` under `@theme`.
Components use token names (`bg-brand-600`, `shadow-card`) and never raw hex,
so a rebrand is a one-file change.

| Token | Use |
|:--|:--|
| `brand-600` | Primary actions |
| `canvas` / `surface` | Page background / card background |
| `hairline` | Every border |
| `shadow-card` / `lift` / `pop` | Resting / hover / floating elevation |

Status colours are defined once in `lib/status.js`. A status can never be
emerald in one component and green-500 in another.

## Connecting to the backend

`data/employeeDashboard.js` matches `get_employee_dashboard_data()` in
`docs/FRONTEND_CONTRACT.md` §1.1. To go live, replace the import in `App.jsx`
with a fetch — no component changes needed.

## Built

- [x] App shell — sidebar, topbar, responsive drawer
- [x] Employee Dashboard
- [ ] Sign in / Sign up
- [ ] Admin / HR Dashboard
- [ ] Profile, Attendance, Leave, Payroll views
