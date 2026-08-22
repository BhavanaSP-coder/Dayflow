import { useMemo } from "react";
import { CalendarCheck, PieChart, TrendingUp, Users, Wallet } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { StatTile } from "../components/ui/StatTile";
import { money } from "../lib/format";
import { ATTENDANCE_STATUS, cx } from "../lib/status";
import { attendance, employees, leaveRequests, payroll } from "../data/store";

/** Read-only analytics — mirrors the four /api/reports/* endpoints. */
export function Reports({ refreshKey }) {
  const leave = useMemo(() => {
    const by = (s) => leaveRequests.filter((l) => l.status === s).length;
    const approved = by("approved"), rejected = by("rejected"), pending = by("pending");
    const decided = approved + rejected;
    const types = {};
    leaveRequests.forEach((l) => { types[l.type] = (types[l.type] || 0) + 1; });
    return {
      total: leaveRequests.length, approved, rejected, pending,
      rate: decided ? Math.round((approved / decided) * 1000) / 10 : 0,
      days: leaveRequests.filter((l) => l.status === "approved").reduce((a, b) => a + b.days, 0),
      types: Object.entries(types).sort((a, b) => b[1] - a[1]),
    };
  }, [refreshKey]);

  const pay = useMemo(() => {
    const nets = payroll.map((p) => p.net_salary);
    return {
      count: payroll.length,
      total: nets.reduce((a, b) => a + b, 0),
      avg: Math.round(nets.reduce((a, b) => a + b, 0) / (nets.length || 1)),
      high: Math.max(...nets), low: Math.min(...nets),
      basic: payroll.reduce((a, p) => a + p.basic_salary, 0),
      allow: payroll.reduce((a, p) => a + p.allowances, 0),
      deduct: payroll.reduce((a, p) => a + p.deductions, 0),
    };
  }, [refreshKey]);

  const att = useMemo(() => {
    const c = (s) => attendance.filter((a) => a.status === s).length;
    const present = c("present"), half = c("half_day"), absent = c("absent"), lv = c("leave");
    const total = attendance.length;
    return { total, present, half, absent, leave: lv,
      rate: total ? Math.round(((present + half / 2) / total) * 1000) / 10 : 0 };
  }, [refreshKey]);

  const depts = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.department] = (m[e.department] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Headcount" value={employees.length} sub={`${employees.filter(e=>e.active).length} active`} />
        <StatTile icon={CalendarCheck} label="Attendance rate" value={`${att.rate}%`} sub={`${att.total} records`} tone="text-emerald-600 bg-emerald-50" />
        <StatTile icon={TrendingUp} label="Leave approval rate" value={`${leave.rate}%`} sub={`${leave.total} requests`} tone="text-amber-600 bg-amber-50" />
        <StatTile icon={Wallet} label="Monthly wage bill" value={money(pay.total)} sub={`avg ${money(pay.avg)}`} tone="text-violet-600 bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Leave report" subtitle="Status split and volume by type" />
          <div className="px-5 py-5">
            <div className="grid grid-cols-3 gap-3">
              {[["Pending", leave.pending, "text-amber-600"], ["Approved", leave.approved, "text-emerald-600"], ["Rejected", leave.rejected, "text-rose-600"]].map(([l, v, tone]) => (
                <div key={l} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                  <p className={cx("tnum text-xl font-bold", tone)}>{v}</p>
                  <p className="text-[11px] font-medium text-slate-500">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">By type</p>
            <ul className="space-y-2.5">
              {leave.types.map(([name, n]) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[12px] text-slate-600">{name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / leave.total) * 100}%` }} />
                  </div>
                  <span className="tnum w-5 text-right text-[12px] font-semibold text-slate-700">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[12px] font-medium text-brand-700">
              {leave.days} approved leave days taken across the organisation.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payroll report" subtitle="August 2026" />
          <div className="px-5 py-5">
            <dl className="divide-y divide-hairline">
              {[["Total net", money(pay.total)], ["Total basic", money(pay.basic)],
                ["Total allowances", money(pay.allow)], ["Total deductions", money(pay.deduct)],
                ["Average net", money(pay.avg)], ["Highest", money(pay.high)], ["Lowest", money(pay.low)]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2.5">
                  <dt className="text-[13px] text-slate-600">{l}</dt>
                  <dd className="tnum text-[13px] font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance report" subtitle={`${att.total} records`} />
          <div className="px-5 py-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {[["present", att.present], ["half_day", att.half], ["leave", att.leave], ["absent", att.absent]].map(([k, v]) => v > 0 && (
                <div key={k} className={cx("h-full", ATTENDANCE_STATUS[k].bar)} style={{ width: `${(v / att.total) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {[["present", att.present], ["half_day", att.half], ["leave", att.leave], ["absent", att.absent]].map(([k, v]) => (
                <li key={k} className="flex items-center gap-2.5">
                  <span className={cx("size-2 rounded-full", ATTENDANCE_STATUS[k].dot)} />
                  <span className="flex-1 text-[13px] text-slate-600">{ATTENDANCE_STATUS[k].label}</span>
                  <span className="tnum text-[13px] font-bold text-slate-900">{v}</span>
                  <span className="tnum w-10 text-right text-[11px] text-slate-400">{Math.round((v / att.total) * 100)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12px] font-medium text-emerald-700">
              Attendance rate {att.rate}% — half-days count as 0.5.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Employee report" subtitle="Headcount by department" />
          <div className="px-5 py-5">
            <ul className="space-y-3">
              {depts.map(([name, n]) => (
                <li key={name}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-[13px] font-medium text-slate-700">{name}</span>
                    <span className="tnum text-[13px] font-bold text-slate-900">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${(n / employees.length) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
