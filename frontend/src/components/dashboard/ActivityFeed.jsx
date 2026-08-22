import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { ALERT_TONE, cx } from "../../lib/status";

const ICONS = { check: CheckCircle2, clock: Clock, alert: AlertTriangle, file: FileText };

/** "Recent activity or alerts" from SRS §3.2.1. */
export function ActivityFeed({ alerts }) {
  return (
    <Card className="animate-rise">
      <CardHeader
        title="Recent activity"
        action={
          <button className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            Mark all read
          </button>
        }
      />
      <ul className="px-2 py-3">
        {alerts.map((a, i) => {
          const Icon = ICONS[a.icon] ?? CheckCircle2;
          return (
            <li key={i} className="relative flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50">
              {/* Timeline rail, stopping before the last item */}
              {i !== alerts.length - 1 && (
                <span className="absolute left-[27px] top-[42px] h-[calc(100%-24px)] w-px bg-hairline" />
              )}
              <span
                className={cx(
                  "z-10 grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                  ALERT_TONE[a.type]
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{a.title}</p>
                  <span className="shrink-0 text-[11px] text-slate-400">{a.time}</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{a.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
