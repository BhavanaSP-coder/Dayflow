import { cx } from "../../lib/status";

/** Thin meter used by leave balances. `value` and `max` are in the same unit. */
export function ProgressBar({ value, max, tone = "bg-brand-600", className }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={cx("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cx("h-full rounded-full transition-[width] duration-500", tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
