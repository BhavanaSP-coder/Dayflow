import { useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, LogIn, LogOut, Timer } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, Td } from "../components/ui/Table";
import { Avatar } from "../components/ui/Avatar";
import { Select } from "../components/ui/Field";
import { ATTENDANCE_STATUS, cx } from "../lib/status";
import { attendanceFor, employees } from "../data/store";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-first week containing `date`. */
function weekOf(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

export function Attendance({ user, isManager }) {
  const [view, setView] = useState("week");
  const [who, setWho] = useState(user.id);
  const [anchor, setAnchor] = useState("2026-08-22");
  const [state, setState] = useState("checked_in");

  const subject = isManager ? who : user.id;
  const records = useMemo(() => attendanceFor(subject), [subject]);
  const byDate = useMemo(() => Object.fromEntries(records.map((r) => [r.date, r])), [records]);
  const week = useMemo(() => weekOf(anchor), [anchor]);

  const totals = records.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1, hours: acc.hours + r.hours }),
    { hours: 0 }
  );
  const weekHours = week.reduce((a, d) => a + (byDate[d]?.hours || 0), 0);
  const shiftWeek = (n) => {
    const d = new Date(anchor); d.setDate(d.getDate() + n * 7);
    setAnchor(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6">
      {/* Check in / out — only for your own record, never someone else's clock */}
      {!isManager && (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className={cx("grid size-12 place-items-center rounded-2xl", state === "checked_in" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                <Timer className="size-6" />
              </span>
              <div>
                <p className="text-[15px] font-bold text-slate-900">
                  {state === "checked_in" ? "You're checked in" : "Not checked in"}
                </p>
                <p className="text-[13px] text-slate-500">
                  {state === "checked_in" ? "Since 09:12 · 3.4h so far today" : "Tap check in to start your day"}
                </p>
              </div>
            </div>
            <Button size="lg" variant={state === "checked_in" ? "secondary" : "primary"}
              onClick={() => setState(state === "checked_in" ? "checked_out" : "checked_in")}>
              {state === "checked_in" ? <><LogOut className="size-4" /> Check out</> : <><LogIn className="size-4" /> Check in</>}
            </Button>
          </div>
        </Card>
      )}

      {/* Month roll-up */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ["Present", totals.present || 0, "text-emerald-600 bg-emerald-50"],
          ["Half-day", totals.half_day || 0, "text-amber-600 bg-amber-50"],
          ["Leave", totals.leave || 0, "text-violet-600 bg-violet-50"],
          ["Absent", totals.absent || 0, "text-rose-600 bg-rose-50"],
          ["Hours", totals.hours.toFixed(1), "text-brand-600 bg-brand-50"],
        ].map(([label, value, tone]) => (
          <Card key={label} className="p-4">
            <span className={cx("inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tone)}>{label}</span>
            <p className="tnum mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Attendance record"
          subtitle={isManager ? "Any employee · last 4 weeks" : "Your record · last 4 weeks"}
          action={
            <div className="flex items-center gap-2">
              {isManager && (
                <Select value={who} onChange={(e) => setWho(Number(e.target.value))} className="h-8 w-44 text-[13px]">
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              )}
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {["week", "list"].map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cx("rounded-md px-2.5 py-1 text-[12px] font-semibold capitalize transition-colors",
                      view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {view === "week" ? (
          <div className="px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => shiftWeek(-1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Previous week">
                <ChevronLeft className="size-4" />
              </button>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-slate-900">{week[0]} → {week[6]}</p>
                <p className="tnum text-[11px] text-slate-400">{weekHours.toFixed(1)}h this week</p>
              </div>
              <button onClick={() => shiftWeek(1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Next week">
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {week.map((date, i) => {
                const rec = byDate[date];
                const meta = rec ? ATTENDANCE_STATUS[rec.status] : null;
                const isToday = date === "2026-08-22";
                const weekend = i >= 5;
                return (
                  <div key={date}
                    title={rec ? `${meta.label} · ${rec.hours}h` : weekend ? "Weekend" : "No record"}
                    className={cx("flex flex-col items-center gap-2 rounded-xl border px-1 py-3 transition-colors",
                      isToday ? "border-brand-200 bg-brand-50/60" : "border-transparent hover:bg-slate-50",
                      weekend && !rec && "opacity-45")}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{WEEKDAYS[i]}</span>
                    <span className={cx("tnum grid size-8 place-items-center rounded-full text-[13px] font-bold",
                      isToday ? "bg-brand-600 text-white" : "text-slate-700")}>
                      {Number(date.slice(8))}
                    </span>
                    <div className="flex h-10 w-full items-end justify-center">
                      {meta ? (
                        <div className={cx("w-1.5 rounded-full transition-all duration-500", meta.bar)}
                          style={{ height: `${Math.max((rec.hours / 9) * 100, 12)}%` }} />
                      ) : <div className="size-1.5 rounded-full bg-slate-200" />}
                    </div>
                    <span className="tnum text-[10px] font-semibold text-slate-400">{rec?.hours ? `${rec.hours}h` : "—"}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-t border-hairline pt-4">
              {Object.entries(ATTENDANCE_STATUS).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className={cx("size-2 rounded-full", v.dot)} /> {v.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-hairline">
            <Table head={[{ label: "Date" }, { label: "Check in" }, { label: "Check out" }, { label: "Hours", align: "right" }, { label: "Status" }]}>
              {records.slice().reverse().map((r) => {
                const meta = ATTENDANCE_STATUS[r.status];
                return (
                  <tr key={r.date} className="transition-colors hover:bg-slate-50/70">
                    <Td><span className="tnum font-medium text-slate-800">{r.date}</span></Td>
                    <Td><span className="tnum">{r.check_in || "—"}</span></Td>
                    <Td><span className="tnum">{r.check_out || "—"}</span></Td>
                    <Td align="right"><span className="tnum font-semibold">{r.hours ? `${r.hours}h` : "—"}</span></Td>
                    <Td><Badge tone={meta.chip} dot={meta.dot}>{meta.label}</Badge></Td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
