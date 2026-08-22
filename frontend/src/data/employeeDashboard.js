/**
 * Mock payload for the Employee Dashboard.
 *
 * The shape mirrors `get_employee_dashboard_data()` in
 * docs/FRONTEND_CONTRACT.md §1.1 exactly, so swapping this file for a real
 * fetch is a one-line change in the page component:
 *
 *   const data = await fetch("/api/dashboard/employee").then(r => r.json());
 */
export const employeeDashboard = {
  has_profile: true,

  employee: {
    id: 7,
    name: "Arjun Nair",
    code: "DF-EMP-1002",
    job_title: "Senior Backend Engineer",
    department: "Engineering",
    manager: "Priya Menon",
    email: "arjun.dev@dayflow.test",
    phone: "+91 98450 11002",
    tenure: "2 y 1 m",
    status: "confirmed",
  },

  attendance: {
    state: "checked_in",
    checked_in_since: "09:12",
    today_hours: 3.4,
    today_status: "present",
    month_label: "August 2026",
    month: {
      present: 14,
      absent: 1,
      half_day: 2,
      leave: 3,
      worked_hours: 118.5,
    },
    week: [
      { date: "2026-08-17", label: "Mon", day_number: 17, is_today: false, is_weekend: false, is_future: false, status: "present",  status_label: "Present",  hours: 8.5 },
      { date: "2026-08-18", label: "Tue", day_number: 18, is_today: false, is_weekend: false, is_future: false, status: "present",  status_label: "Present",  hours: 8.2 },
      { date: "2026-08-19", label: "Wed", day_number: 19, is_today: false, is_weekend: false, is_future: false, status: "half_day", status_label: "Half-day", hours: 4.0 },
      { date: "2026-08-20", label: "Thu", day_number: 20, is_today: false, is_weekend: false, is_future: false, status: "leave",    status_label: "Leave",    hours: 0 },
      { date: "2026-08-21", label: "Fri", day_number: 21, is_today: false, is_weekend: false, is_future: false, status: "present",  status_label: "Present",  hours: 8.9 },
      { date: "2026-08-22", label: "Sat", day_number: 22, is_today: true,  is_weekend: false, is_future: false, status: "present",  status_label: "Present",  hours: 3.4 },
      { date: "2026-08-23", label: "Sun", day_number: 23, is_today: false, is_weekend: true,  is_future: true,  status: false,      status_label: "",         hours: 0 },
    ],
  },

  leave: {
    pending_count: 1,
    balance_total: 12.5,
    balances: [
      { id: 1, name: "Paid Time Off", code: "PTO",  category: "paid",   allocated: 18.0, taken: 5.5, pending: 3.0, remaining: 12.5 },
      { id: 2, name: "Sick Leave",    code: "SICK", category: "sick",   allocated: 12.0, taken: 2.0, pending: 0.0, remaining: 10.0 },
      { id: 3, name: "Unpaid Leave",  code: "UNPD", category: "unpaid", allocated: 0.0,  taken: 1.0, pending: 0.0, remaining: 0.0  },
    ],
    recent: [
      { id: 41, name: "DF-LV-2026-00041", type: "Paid Time Off", category: "paid",   from: "2026-09-01", to: "2026-09-03", days: 3,   status: "pending",  applied_on: "2026-08-20" },
      { id: 38, name: "DF-LV-2026-00038", type: "Sick Leave",    category: "sick",   from: "2026-08-19", to: "2026-08-19", days: 0.5, status: "approved", applied_on: "2026-08-18" },
      { id: 34, name: "DF-LV-2026-00034", type: "Paid Time Off", category: "paid",   from: "2026-08-11", to: "2026-08-12", days: 2,   status: "approved", applied_on: "2026-08-04" },
      { id: 29, name: "DF-LV-2026-00029", type: "Unpaid Leave",  category: "unpaid", from: "2026-07-28", to: "2026-07-28", days: 1,   status: "rejected", applied_on: "2026-07-21" },
    ],
  },

  payroll: {
    last_net: 91480.0,
    currency: "₹",
    recent: [
      { id: 3, name: "DF-PS-202607-0002", period: "July 2026", net: 91480.0, state: "paid" },
      { id: 2, name: "DF-PS-202606-0002", period: "June 2026", net: 89240.0, state: "paid" },
    ],
  },

  alerts: [
    { type: "success", icon: "check",  title: "Leave approved",     message: "DF-LV-2026-00038 was approved by Priya Menon", time: "2 h ago" },
    { type: "info",    icon: "clock",  title: "Checked in at 09:12", message: "You're 12 minutes past your 09:00 shift start", time: "Today" },
    { type: "warning", icon: "alert",  title: "Timesheet reminder",  message: "3 days last week are missing a check-out time", time: "Yesterday" },
    { type: "info",    icon: "file",   title: "Payslip available",   message: "DF-PS-202607-0002 for July 2026 is ready to download", time: "1 Aug" },
  ],
};
