/**
 * In-memory demo data + mutations.
 *
 * Everything the UI needs, shaped like the API in docs/FRONTEND_CONTRACT.md.
 * Swapping this for real `fetch` calls is a per-function change — the
 * components only ever call the exported helpers, never touch the arrays.
 */

export const ROLES = { EMPLOYEE: "employee", HR: "hr", ADMIN: "admin" };

export const employees = [
  { id: 1, code: "DF-EMP-1002", name: "Arjun Nair",     first: "Arjun", email: "arjun@dayflow.com",  role: "employee", job_title: "Senior Backend Engineer", department: "Engineering", manager: "Priya Menon", phone: "+91 98450 11002", address: "42 Brigade Road, Bengaluru 560001", tenure: "2 y 1 m", joined: "2024-07-15", active: true },
  { id: 2, code: "DF-HR-0001",  name: "Priya Menon",    first: "Priya", email: "priya@dayflow.com",  role: "hr",       job_title: "HR Lead",                 department: "People",      manager: "Rahul Iyer",  phone: "+91 98450 20001", address: "18 Indiranagar, Bengaluru 560038", tenure: "3 y 4 m", joined: "2023-04-02", active: true },
  { id: 3, code: "DF-ADM-0001", name: "Rahul Iyer",     first: "Rahul", email: "rahul@dayflow.com",  role: "admin",    job_title: "Director of Operations",  department: "Leadership",  manager: "—",           phone: "+91 98450 30001", address: "7 Koramangala, Bengaluru 560034", tenure: "5 y 0 m", joined: "2021-08-01", active: true },
  { id: 4, code: "DF-EMP-1003", name: "Sneha Kulkarni", first: "Sneha", email: "sneha@dayflow.com",  role: "employee", job_title: "Frontend Engineer",       department: "Engineering", manager: "Priya Menon", phone: "+91 98450 11003", address: "22 HSR Layout, Bengaluru 560102", tenure: "1 y 3 m", joined: "2025-05-19", active: true },
  { id: 5, code: "DF-EMP-1004", name: "Vikram Rao",     first: "Vikram", email: "vikram@dayflow.com", role: "employee", job_title: "QA Analyst",             department: "Engineering", manager: "Priya Menon", phone: "+91 98450 11004", address: "5 Jayanagar, Bengaluru 560041", tenure: "0 y 8 m", joined: "2025-12-01", active: true },
  { id: 6, code: "DF-EMP-1005", name: "Meera Joshi",    first: "Meera", email: "meera@dayflow.com",  role: "employee", job_title: "Finance Associate",       department: "Finance",     manager: "Rahul Iyer",  phone: "+91 98450 11005", address: "91 Whitefield, Bengaluru 560066", tenure: "2 y 6 m", joined: "2024-02-12", active: true },
  { id: 7, code: "DF-EMP-1006", name: "Karan Shah",     first: "Karan", email: "karan@dayflow.com",  role: "employee", job_title: "Recruiter",               department: "People",      manager: "Priya Menon", phone: "+91 98450 11006", address: "33 Malleshwaram, Bengaluru 560003", tenure: "0 y 2 m", joined: "2026-06-08", active: false },
];

export const byId = (id) => employees.find((e) => e.id === Number(id));

/* ------------------------------- attendance ------------------------------- */
const TODAY = new Date("2026-08-22");
const iso = (d) => d.toISOString().slice(0, 10);
const shift = (base, days) => { const d = new Date(base); d.setDate(d.getDate() + days); return d; };

function seedMonth(employeeId) {
  const out = [];
  for (let i = 27; i >= 0; i--) {
    const d = shift(TODAY, -i);
    const dow = d.getDay();
    // Skip weekends — except the demo "today", which must always have a record
    // or every "present today" figure in the app reads as zero.
    const isAnchor = i === 0;
    if ((dow === 0 || dow === 6) && !isAnchor) continue;
    const roll = (employeeId * 7 + i) % 11;
    const status = roll === 0 ? "absent" : roll === 1 ? "leave" : roll === 2 ? "half_day" : "present";
    const hours = status === "present" ? 8 + ((i % 4) * 0.3) : status === "half_day" ? 4.1 : 0;
    out.push({
      date: iso(d), employee_id: employeeId, status,
      check_in: hours ? "09:12" : null,
      check_out: hours ? (status === "half_day" ? "13:18" : "18:04") : null,
      hours: Number(hours.toFixed(1)),
    });
  }
  return out;
}
export const attendance = employees.flatMap((e) => seedMonth(e.id));
export const attendanceFor = (id) => attendance.filter((a) => a.employee_id === Number(id));

/* --------------------------------- leave ---------------------------------- */
export const LEAVE_TYPES = [
  { code: "PAID",   name: "Paid Time Off", category: "paid" },
  { code: "SICK",   name: "Sick Leave",    category: "sick" },
  { code: "UNPAID", name: "Unpaid Leave",  category: "unpaid" },
];

export let leaveRequests = [
  { id: 41, employee_id: 1, type: "Paid Time Off", code: "PAID",   from: "2026-09-01", to: "2026-09-03", days: 3,   status: "pending",  remarks: "Family function",       admin_comment: null,                 applied_on: "2026-08-20", reviewed_by: null },
  { id: 40, employee_id: 4, type: "Sick Leave",    code: "SICK",   from: "2026-08-25", to: "2026-08-26", days: 2,   status: "pending",  remarks: "Fever",                 admin_comment: null,                 applied_on: "2026-08-21", reviewed_by: null },
  { id: 39, employee_id: 5, type: "Paid Time Off", code: "PAID",   from: "2026-09-10", to: "2026-09-14", days: 5,   status: "pending",  remarks: "Wedding in the family", admin_comment: null,                 applied_on: "2026-08-19", reviewed_by: null },
  { id: 38, employee_id: 1, type: "Sick Leave",    code: "SICK",   from: "2026-08-19", to: "2026-08-19", days: 0.5, status: "approved", remarks: "Dental appointment",    admin_comment: "Approved, get well", applied_on: "2026-08-18", reviewed_by: 2 },
  { id: 34, employee_id: 1, type: "Paid Time Off", code: "PAID",   from: "2026-08-11", to: "2026-08-12", days: 2,   status: "approved", remarks: "Short break",           admin_comment: "Enjoy",              applied_on: "2026-08-04", reviewed_by: 2 },
  { id: 29, employee_id: 1, type: "Unpaid Leave",  code: "UNPAID", from: "2026-07-28", to: "2026-07-28", days: 1,   status: "rejected", remarks: "Personal",              admin_comment: "Team is short-staffed", applied_on: "2026-07-21", reviewed_by: 2 },
  { id: 27, employee_id: 6, type: "Paid Time Off", code: "PAID",   from: "2026-07-14", to: "2026-07-18", days: 5,   status: "approved", remarks: "Annual holiday",        admin_comment: "Approved",           applied_on: "2026-07-01", reviewed_by: 3 },
];

export const leaveBalances = (employeeId) => {
  const mine = leaveRequests.filter((l) => l.employee_id === Number(employeeId));
  const sum = (code, status) =>
    mine.filter((l) => l.code === code && l.status === status).reduce((a, b) => a + b.days, 0);
  return [
    { id: 1, name: "Paid Time Off", code: "PAID",   category: "paid",   allocated: 18, taken: sum("PAID", "approved"),   pending: sum("PAID", "pending") },
    { id: 2, name: "Sick Leave",    code: "SICK",   category: "sick",   allocated: 12, taken: sum("SICK", "approved"),   pending: sum("SICK", "pending") },
    { id: 3, name: "Unpaid Leave",  code: "UNPAID", category: "unpaid", allocated: 0,  taken: sum("UNPAID", "approved"), pending: sum("UNPAID", "pending") },
  ].map((b) => ({ ...b, remaining: Math.max(0, b.allocated - b.taken - b.pending) }));
};

/* -------------------------------- payroll --------------------------------- */
export let payroll = employees.map((e, i) => {
  const basic = [52000, 78000, 120000, 46000, 38000, 41000, 35000][i];
  const allowances = Math.round(basic * 0.1);
  const deductions = Math.round(basic * 0.04);
  return {
    id: i + 1, employee_id: e.id, basic_salary: basic, allowances, deductions,
    net_salary: basic + allowances - deductions, month: 8, year: 2026, currency: "₹",
  };
});
export const payrollFor = (id) => payroll.filter((p) => p.employee_id === Number(id));

/* ----------------------------- notifications ------------------------------ */
export let notifications = [
  { id: 1, user_id: 1, type: "LEAVE_APPROVED", icon: "check", title: "Leave approved",     message: "DF-LV-2026-00038 was approved by Priya Menon",       is_read: false, time: "2 h ago" },
  { id: 2, user_id: 1, type: "GENERAL",        icon: "clock", title: "Checked in at 09:12", message: "You're 12 minutes past your 09:00 shift start",      is_read: false, time: "Today" },
  { id: 3, user_id: 1, type: "GENERAL",        icon: "alert", title: "Timesheet reminder",  message: "3 days last week are missing a check-out time",      is_read: true,  time: "Yesterday" },
  { id: 4, user_id: 1, type: "PAYROLL_UPDATED",icon: "file",  title: "Payslip available",   message: "DF-PS-202607-0002 for July 2026 is ready",           is_read: true,  time: "1 Aug" },
  { id: 5, user_id: 2, type: "LEAVE_SUBMITTED",icon: "alert", title: "New leave request",   message: "Arjun Nair requested 3 days from 01 Sep",            is_read: false, time: "2 d ago" },
];

/* -------------------------------- mutations -------------------------------- */
let nextLeaveId = 100;
let nextNotifId = 100;

export function applyForLeave({ employee_id, code, from, to, remarks }) {
  const meta = LEAVE_TYPES.find((t) => t.code === code);
  const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
  if (new Date(from) > new Date(to)) throw new Error("Start date cannot be after end date.");
  const clash = leaveRequests.find(
    (l) => l.employee_id === employee_id && ["pending", "approved"].includes(l.status) &&
      new Date(l.from) <= new Date(to) && new Date(l.to) >= new Date(from)
  );
  if (clash) throw new Error(`These dates overlap request #${clash.id}.`);
  const row = { id: ++nextLeaveId, employee_id, type: meta.name, code, from, to, days,
    status: "pending", remarks, admin_comment: null, applied_on: iso(new Date()), reviewed_by: null };
  leaveRequests = [row, ...leaveRequests];
  // notify every HR/admin — the same fan-out the backend does
  employees.filter((e) => e.role !== "employee").forEach((hr) =>
    notifications.unshift({ id: ++nextNotifId, user_id: hr.id, type: "LEAVE_SUBMITTED", icon: "alert",
      title: "New leave request", message: `${byId(employee_id).name} requested ${days} day(s) from ${from}`,
      is_read: false, time: "just now" }));
  return row;
}

export function decideLeave(id, decision, comment, reviewerId) {
  const row = leaveRequests.find((l) => l.id === id);
  if (!row) throw new Error("Request not found.");
  if (row.status !== "pending") throw new Error(`Already ${row.status}.`);
  if (decision === "rejected" && !comment?.trim()) throw new Error("A reason is required when rejecting.");
  row.status = decision;
  row.admin_comment = comment || null;
  row.reviewed_by = reviewerId;
  notifications.unshift({ id: ++nextNotifId, user_id: row.employee_id,
    type: decision === "approved" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
    icon: decision === "approved" ? "check" : "alert",
    title: `Leave ${decision}`, message: `Your ${row.type} (${row.from} → ${row.to}) was ${decision}.`,
    is_read: false, time: "just now" });
  return row;
}

export function savePayroll(employee_id, { basic_salary, allowances, deductions, month, year }) {
  const net = basic_salary + allowances - deductions;
  if (net < 0) throw new Error("Deductions cannot exceed basic salary plus allowances.");
  const existing = payroll.find((p) => p.employee_id === employee_id && p.month === month && p.year === year);
  if (existing) Object.assign(existing, { basic_salary, allowances, deductions, net_salary: net });
  else payroll = [...payroll, { id: payroll.length + 1, employee_id, basic_salary, allowances, deductions, net_salary: net, month, year, currency: "₹" }];
  notifications.unshift({ id: ++nextNotifId, user_id: employee_id, type: "PAYROLL_UPDATED", icon: "file",
    title: "Payroll updated", message: `Your payroll for ${String(month).padStart(2,"0")}/${year} was updated.`,
    is_read: false, time: "just now" });
  return net;
}

export const notificationsFor = (userId) => notifications.filter((n) => n.user_id === Number(userId));
