import { cx } from "../../lib/status";

/**
 * The surface every panel sits on.
 *
 * `interactive` adds the hover lift used by clickable cards. Everything else
 * stays visually identical, which is what keeps the dashboard looking like one
 * designed system rather than a pile of boxes.
 */
export function Card({ as: Tag = "div", interactive = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border border-hairline bg-surface shadow-card",
        interactive &&
          "group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
