import { cx } from "../../lib/status";

/** Scroll container so wide tables never push the page sideways on mobile. */
export function Table({ head, children, className }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            {head.map((h) => (
              <th
                key={h.key ?? h.label}
                className={cx(
                  "px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400",
                  h.align === "right" && "text-right"
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ align, className, children, ...rest }) {
  return (
    <td
      className={cx("px-4 py-3 text-[13px] text-slate-700", align === "right" && "text-right", className)}
      {...rest}
    >
      {children}
    </td>
  );
}
