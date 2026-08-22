import { initials } from "../../lib/format";
import { cx } from "../../lib/status";

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-14 text-base",
};

/**
 * Initials avatar with a deterministic gradient.
 *
 * No image URL yet, and a coloured monogram reads better than a grey
 * placeholder silhouette. Swap in <img> once the backend serves avatars.
 */
export function Avatar({ name, size = "md", ring = false, className }) {
  return (
    <div
      className={cx(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white",
        ring && "ring-2 ring-white",
        SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
