import { Building2, Mail, Phone, UserRound } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

/** Compact identity panel — the dashboard's window into the full profile view. */
export function ProfileCard({ employee, onOpen }) {
  const rows = [
    { icon: Building2, label: employee.department },
    { icon: UserRound, label: `Reports to ${employee.manager}` },
    { icon: Mail, label: employee.email },
    { icon: Phone, label: employee.phone },
  ];

  return (
    <Card className="animate-rise overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700" />
      <div className="-mt-8 px-5 pb-5">
        <Avatar name={employee.name} size="lg" ring className="shadow-lift" />
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
              {employee.name}
            </p>
            <p className="truncate text-[13px] text-slate-500">{employee.job_title}</p>
          </div>
          <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20" dot="bg-emerald-500">
            Confirmed
          </Badge>
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-hairline pt-4">
          {rows.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon className="size-3.5 shrink-0 text-slate-400" />
              <dd className="truncate text-[12px] text-slate-600">{label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="text-[11px] font-medium text-slate-500">Tenure</span>
          <span className="tnum text-[13px] font-bold text-slate-900">{employee.tenure}</span>
        </div>

        <button
          onClick={onOpen}
          className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          View full profile
        </button>
      </div>
    </Card>
  );
}
