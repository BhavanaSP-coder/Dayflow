import { useState } from "react";
import { LogIn, LogOut, Timer } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { greeting, hours, longDate } from "../../lib/format";
import { ATTENDANCE_STATUS } from "../../lib/status";

/**
 * The hero panel: greeting, today's clock state, and the single most important
 * action on the page — check in / check out.
 *
 * The button is the only filled-brand control above the fold, so the eye lands
 * on it first. Optimistic local state keeps it responsive; wire `onToggle` to
 * the real endpoint and reconcile on the response.
 */
export function TodayCard({ employee, attendance }) {
  const [state, setState] = useState(attendance.state);
  const checkedIn = state === "checked_in";
  const status = ATTENDANCE_STATUS[attendance.today_status];

  return (
    <section className="animate-rise overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 shadow-lift">
      {/* Decorative wash — kept low-contrast so text stays AA-legible. */}
      <div className="relative isolate px-6 py-6 sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 right-24 -z-10 size-64 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-brand-100">{longDate()}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              {greeting()}, {employee.name.split(" ")[0]}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {status && (
                <Badge tone="bg-white/15 text-white ring-white/25" dot={status.dot}>
                  {status.label} today
                </Badge>
              )}
              {checkedIn && (
                <Badge tone="bg-white/15 text-white ring-white/25">
                  <Timer className="size-3" />
                  Since {attendance.checked_in_since}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 lg:gap-7">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-200">
                Today
              </p>
              <p className="tnum text-3xl font-bold text-white">
                {hours(attendance.today_hours)}
              </p>
            </div>
            <div className="h-12 w-px bg-white/20" />
            <Button
              variant="inverse"
              size="lg"
              onClick={() => setState(checkedIn ? "checked_out" : "checked_in")}
            >
              {checkedIn ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
              {checkedIn ? "Check out" : "Check in"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
