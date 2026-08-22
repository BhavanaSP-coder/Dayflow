import { ChevronRight } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { ATTENDANCE_STATUS, cx } from "../../lib/status";

/**
 * The weekly attendance view from SRS §3.4.1 — seven columns, Monday first,
 * exactly as the contract delivers them.
 *
 * A legend sits under the strip because colour alone is not an accessible
 * carrier of meaning; each cell also states its status in text.
 */
export function WeekStrip({ week, monthLabel, month }) {
  const peak = Math.max(...week.map((d) => d.hours), 8);

  return (
    <Card className="animate-rise">
      <CardHeader
        title="This week"
        subtitle={monthLabel}
        action={
          <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            Full calendar <ChevronRight className="size-3.5" />
          </button>
        }
      />

      <div className="grid grid-cols-7 gap-1.5 px-5 py-5 sm:gap-2">
        {week.map((day) => {
          const meta = day.status ? ATTENDANCE_STATUS[day.status] : null;
          const barPct = day.hours > 0 ? Math.round((day.hours / peak) * 100) : 0;

          return (
            <div
              key={day.date}
              className={cx(
                "flex flex-col items-center gap-2 rounded-xl border px-1 py-3 transition-colors",
                day.is_today
                  ? "border-brand-200 bg-brand-50/60"
                  : "border-transparent hover:bg-slate-50",
                day.is_future && "opacity-45"
              )}
              title={day.status_label || (day.is_weekend ? "Weekend" : "No record")}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {day.label}
              </span>
              <span
                className={cx(
                  "tnum grid size-8 place-items-center rounded-full text-[13px] font-bold",
                  day.is_today ? "bg-brand-600 text-white" : "text-slate-700"
                )}
              >
                {day.day_number}
              </span>

              {/* Hours bar — height encodes the day, colour encodes the status */}
              <div className="flex h-10 w-full items-end justify-center">
                {meta ? (
                  <div
                    className={cx("w-1.5 rounded-full transition-all duration-500", meta.bar)}
                    style={{ height: `${Math.max(barPct, 12)}%` }}
                  />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                )}
              </div>

              <span className="tnum text-[10px] font-semibold text-slate-400">
                {day.hours > 0 ? `${day.hours}h` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Month roll-up */}
      <div className="grid grid-cols-4 divide-x divide-hairline border-t border-hairline">
        {[
          ["Present", month.present, "text-emerald-600"],
          ["Half-day", month.half_day, "text-amber-600"],
          ["Leave", month.leave, "text-violet-600"],
          ["Absent", month.absent, "text-rose-600"],
        ].map(([label, value, tone]) => (
          <div key={label} className="px-3 py-3.5 text-center">
            <p className={cx("tnum text-lg font-bold", tone)}>{value}</p>
            <p className="text-[11px] font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
