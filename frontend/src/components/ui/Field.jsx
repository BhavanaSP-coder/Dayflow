import { cx } from "../../lib/status";

/** Label + control + error message. One wrapper so every form looks identical. */
export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

const BASE =
  "w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 " +
  "transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50";
const OK = "border-slate-200 focus:border-brand-400 focus:ring-brand-100";
const BAD = "border-rose-300 focus:border-rose-400 focus:ring-rose-100";

export function Input({ invalid, className, ...rest }) {
  return <input className={cx(BASE, "h-11", invalid ? BAD : OK, className)} {...rest} />;
}

export function Select({ invalid, className, children, ...rest }) {
  return (
    <select className={cx(BASE, "h-11 pr-8", invalid ? BAD : OK, className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ invalid, className, ...rest }) {
  return (
    <textarea
      rows={3}
      className={cx(BASE, "py-2.5 resize-y", invalid ? BAD : OK, className)}
      {...rest}
    />
  );
}
