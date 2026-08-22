import { cx } from "../../lib/status";

/**
 * Status pill. `tone` is a full Tailwind class string from lib/status.js
 * rather than a colour name, so the vocabulary stays centralised.
 */
export function Badge({ tone, dot, children, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tone,
        className
      )}
    >
      {dot && <span className={cx("size-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}
