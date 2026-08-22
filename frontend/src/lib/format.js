/** Presentation helpers. Pure functions, no React. */

export const money = (value, currency = "₹") =>
  `${currency}${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const hours = (value) => `${Number(value).toFixed(1)}h`;

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** "Good morning" / "Good afternoon" / "Good evening" from the local clock. */
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const longDate = (date = new Date()) =>
  date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
