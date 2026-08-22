/**
 * Status vocabulary shared by attendance chips, calendars and leave badges.
 *
 * Kept in one file so a status can never be emerald in one component and
 * green-500 in another. Every component asks this module for its colours.
 */

export const ATTENDANCE_STATUS = {
  present: {
    label: "Present",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    bar: "bg-emerald-500",
  },
  half_day: {
    label: "Half-day",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-600/20",
    bar: "bg-amber-500",
  },
  leave: {
    label: "Leave",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700 ring-violet-600/20",
    bar: "bg-violet-500",
  },
  absent: {
    label: "Absent",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-rose-600/20",
    bar: "bg-rose-500",
  },
};

export const LEAVE_STATUS = {
  pending: {
    label: "Pending",
    chip: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    chip: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
  },
};

export const ALERT_TONE = {
  success: "bg-emerald-50 text-emerald-600 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-600 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-600 ring-rose-600/20",
  info: "bg-brand-50 text-brand-600 ring-brand-600/20",
};

/** Small helper for conditional class names — avoids a clsx dependency. */
export const cx = (...parts) => parts.filter(Boolean).join(" ");
