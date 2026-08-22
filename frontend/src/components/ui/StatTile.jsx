import { cx } from "../../lib/status";
import { Card } from "./Card";

/** KPI tile for the HR dashboard. */
export function StatTile({ icon: Icon, label, value, sub, tone = "text-brand-600 bg-brand-50" }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <span className={cx("grid size-9 place-items-center rounded-xl", tone)}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="tnum mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </Card>
  );
}
