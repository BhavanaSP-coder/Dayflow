import { useMemo, useState } from "react";
import {
  ArrowRight, CalendarClock, Check, Search, TrendingUp, UserCheck, Users, Wallet, X,
} from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { StatTile } from "../components/ui/StatTile";
import { Table, Td } from "../components/ui/Table";
import { money } from "../lib/format";
import { ATTENDANCE_STATUS, LEAVE_STATUS, cx } from "../lib/status";
import { attendanceFor, byId, employees, leaveRequests, payroll } from "../data/store";

const TODAY = "2026-08-22";

export function HRDashboard({ onOpenEmployee, onNavigate, refreshKey }) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const today = employees.map((e) => attendanceFor(e.id).find((a) => a.date === TODAY)).filter(Boolean);
    const count = (s) => today.filter((a) => a.status === s).length;
    const present = count("present"), half = count("half_day"), leave = count("leave"), absent = count("absent");
    const credited = present + half / 2;
    return {
      headcount: employees.length,
      active: employees.filter((e) => e.active).length,
      present, half, leave, absent,
      rate: today.length ? Math.round((credited / today.length) * 1000) / 10 : 0,
      pending: leaveRequests.filter((l) => l.status === "pending").length,
      wageBill: payroll.reduce((a, p) => a + p.net_salary, 0),
    };
  }, [refreshKey]);

  const breakdown = [
    { key: "present",  label: "Present",  count: stats.present, tone: "bg-emerald-500" },
    { key: "half_day", label: "Half-day", count: stats.half,    tone: "bg-amber-500" },
    { key: "leave",    label: "Leave",    count: stats.leave,   tone: "bg-violet-500" },
    { key: "absent",   label: "Absent",   count: stats.absent,  tone: "bg-rose-500" },
  ];
  const totalToday = breakdown.reduce((a, b) => a + b.count, 0) || 1;

  const departments = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.department] = (m[e.department] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, []);

  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
  }, [query]);

  const pendingRows = leaveRequests.filter((l) => l.status === "pending");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Headcount" value={stats.headcount} sub={`${stats.active} active`} />
        <StatTile icon={UserCheck} label="Present today" value={stats.present} sub={`${stats.rate}% attendance`} tone="text-emerald-600 bg-emerald-50" />
        <StatTile icon={CalendarClock} label="Pending approvals" value={stats.pending} sub="Awaiting your decision" tone="text-amber-600 bg-amber-50" />
        <StatTile icon={Wallet} label="Monthly wage bill" value={money(stats.wageBill)} sub="August 2026" tone="text-violet-600 bg-violet-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Approvals queue — the reason HR opens this page */}
        <Card className="lg:col-span-8">
          <CardHeader
            title="Leave approvals"
            subtitle={stats.pending ? `${stats.pending} waiting on a decision` : "All caught up"}
            action={
              <button onClick={() => onNavigate("leave")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Open queue <ArrowRight className="size-3.5" />
              </button>
            }
          />
          <div className="border-t border-hairline">
            {pendingRows.length === 0 ? (
              <EmptyState icon={Check} title="Nothing pending" message="Every leave request has been decided." />
            ) : (
              <Table head={[{ label: "Employee" }, { label: "Type" }, { label: "Dates" }, { label: "Days", align: "right" }, { label: "", align: "right" }]}>
                {pendingRows.map((r) => {
                  const emp = byId(r.employee_id);
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">{emp.name}</p>
                            <p className="truncate text-[11px] text-slate-400">{emp.department}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>{r.type}</Td>
                      <Td><span className="tnum">{r.from} → {r.to}</span></Td>
                      <Td align="right"><span className="tnum font-semibold">{r.days}</span></Td>
                      <Td align="right">
                        <Button size="sm" variant="secondary" onClick={() => onNavigate("leave")}>Review</Button>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </div>
        </Card>

        {/* Today at a glance */}
        <Card className="lg:col-span-4">
          <CardHeader title="Today" subtitle={TODAY} />
          <div className="px-5 py-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {breakdown.map((b) => b.count > 0 && (
                <div key={b.key} className={cx("h-full transition-all", b.tone)} style={{ width: `${(b.count / totalToday) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {breakdown.map((b) => (
                <li key={b.key} className="flex items-center gap-2.5">
                  <span className={cx("size-2 rounded-full", b.tone)} />
                  <span className="flex-1 text-[13px] text-slate-600">{b.label}</span>
                  <span className="tnum text-[13px] font-bold text-slate-900">{b.count}</span>
                  <span className="tnum w-10 text-right text-[11px] text-slate-400">
                    {Math.round((b.count / totalToday) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">By department</p>
              <ul className="space-y-2">
                {departments.map(([name, n]) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-[12px] text-slate-600">{name}</span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / employees.length) * 100}%` }} />
                    </div>
                    <span className="tnum w-4 text-right text-[12px] font-semibold text-slate-700">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee directory with quick-switch */}
      <Card>
        <CardHeader
          title="Employee directory"
          subtitle="Select anyone to view their record"
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, code, department…"
                className="h-8 w-56 rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-[13px] placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>
          }
        />
        <div className="border-t border-hairline">
          {directory.length === 0 ? (
            <EmptyState icon={Users} title="No matches" message={`Nothing matched "${query}".`} />
          ) : (
            <Table head={[{ label: "Employee" }, { label: "Department" }, { label: "Role" }, { label: "Today" }, { label: "", align: "right" }]}>
              {directory.map((e) => {
                const today = attendanceFor(e.id).find((a) => a.date === TODAY);
                const meta = today ? ATTENDANCE_STATUS[today.status] : null;
                return (
                  <tr key={e.id} className="cursor-pointer transition-colors hover:bg-slate-50/70" onClick={() => onOpenEmployee(e)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{e.name}</p>
                          <p className="tnum truncate text-[11px] text-slate-400">{e.code} · {e.job_title}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{e.department}</Td>
                    <Td>
                      <Badge tone={e.role === "admin" ? "bg-violet-50 text-violet-700 ring-violet-600/20"
                        : e.role === "hr" ? "bg-brand-50 text-brand-700 ring-brand-600/20"
                        : "bg-slate-100 text-slate-600 ring-slate-300"}>
                        {e.role.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>{meta ? <Badge tone={meta.chip} dot={meta.dot}>{meta.label}</Badge> : <span className="text-slate-400">—</span>}</Td>
                    <Td align="right"><ArrowRight className="ml-auto size-4 text-slate-300" /></Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
