import { cx } from "../../lib/status";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 hover:ring-rose-300",
  /* For placement ON a brand-coloured surface (the dashboard hero).
     A real variant, not a className override: Tailwind orders utilities by its
     own internal sequence, so an ad-hoc `text-brand-700` loses to the variant's
     `text-white` regardless of the order they appear in the class attribute. */
  inverse:
    "bg-white text-brand-700 shadow-pop hover:bg-brand-50 active:bg-brand-100",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
