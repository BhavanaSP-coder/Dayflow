import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { LEAVE_STATUS, cx } from "../../lib/status";

const CATEGORY_TONE = {
  paid: "bg-brand-600",
  sick: "bg-emerald-500",
  unpaid: "bg-slate-400",
};

/** Leave balances plus the most recent requests and their status badges. */
export function LeaveSummary({ leave, onApply }) {
  return (
    <Card className="animate-rise">
      <CardHeader
        title="Leave & time-off"
        subtitle={`${leave.balance_total} days available`}
        action={
          <Button size="sm" onClick={onApply}>
            <Plus className="size-3.5" />
            Apply
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-5">
        {leave.balances.map((b) => {
          const max = Math.max(b.allocated, b.taken + b.pending, 1);
          return (
            <div key={b.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-slate-700">{b.name}</span>
                <span className="tnum text-[13px] font-semibold text-slate-900">
                  {b.remaining}
                  <span className="font-normal text-slate-400">
                    {b.allocated > 0 ? ` / ${b.allocated}` : " days"}
                  </span>
                </span>
              </div>
              <ProgressBar
                value={b.taken + b.pending}
                max={max}
                tone={CATEGORY_TONE[b.category] ?? "bg-brand-600"}
              />
            </div>
          );
        })}
      </div>

      <div className="border-t border-hairline">
        <p className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Recent requests
        </p>
        <ul className="divide-y divide-hairline">
          {leave.recent.slice(0, 3).map((r) => {
            const meta = LEAVE_STATUS[r.status];
            return (
              <li
                key={r.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800">{r.type}</p>
                  <p className="tnum mt-0.5 text-[11px] text-slate-500">
                    {r.from} → {r.to} · {r.days} {r.days === 1 ? "day" : "days"}
                  </p>
                </div>
                <Badge tone={meta.chip} dot={meta.dot}>
                  {meta.label}
                </Badge>
              </li>
            );
          })}
        </ul>
        <button className="flex w-full items-center justify-center gap-1 border-t border-hairline py-3 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-50/50">
          View all requests <ChevronRight className="size-3.5" />
        </button>
      </div>
    </Card>
  );
}
