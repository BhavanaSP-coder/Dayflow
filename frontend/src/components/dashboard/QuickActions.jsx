import { CalendarCheck, ChevronRight, CircleUser, LogOut, Plane } from "lucide-react";
import { Card } from "../ui/Card";
import { cx } from "../../lib/status";

/**
 * The four quick-access cards named in the SRS (§3.2.1): Profile, Attendance,
 * Leave Requests and Logout.
 *
 * Logout is deliberately styled apart — same footprint so the grid stays even,
 * but neutral iconography and a rose hover, so a destructive action never
 * looks like just another feature tile.
 */
const ACTIONS = [
  { key: "profile",    label: "Profile",        hint: "Personal & job details", icon: CircleUser,    tone: "text-brand-600 bg-brand-50" },
  { key: "attendance", label: "Attendance",     hint: "Daily & weekly view",    icon: CalendarCheck, tone: "text-emerald-600 bg-emerald-50" },
  { key: "leave",      label: "Leave Requests", hint: "Apply & track status",   icon: Plane,         tone: "text-violet-600 bg-violet-50", badgeKey: "pending" },
];

export function QuickActions({ onNavigate, onLogout, pending = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ACTIONS.map(({ key, label, hint, icon: Icon, tone, badgeKey }) => {
        const badge = badgeKey === "pending" ? pending : 0;
        return (
        <Card
          as="button"
          interactive
          key={key}
          onClick={() => onNavigate(key)}
          className="p-4 text-left"
        >
          <div className="flex items-start justify-between">
            <span className={cx("grid size-10 place-items-center rounded-xl", tone)}>
              <Icon className="size-5" />
            </span>
            {badge ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                {badge} pending
              </span>
            ) : (
              <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-[12px] text-slate-500">{hint}</p>
        </Card>
        );
      })}

      <Card as="button" interactive onClick={onLogout} className="p-4 text-left hover:!border-rose-200">
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-rose-50 group-hover:text-rose-600">
            <LogOut className="size-5" />
          </span>
          <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-400" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-rose-700">Logout</p>
        <p className="mt-0.5 text-[12px] text-slate-500">End your session</p>
      </Card>
    </div>
  );
}
