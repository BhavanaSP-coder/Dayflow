import { CalendarCheck, ShieldCheck, TrendingUp } from "lucide-react";

const POINTS = [
  { icon: CalendarCheck, title: "Attendance that tracks itself", body: "One tap to check in. Daily and weekly views, always current." },
  { icon: ShieldCheck,   title: "Role-based by default",        body: "Employees, HR and admins each see exactly what they should." },
  { icon: TrendingUp,    title: "Answers, not spreadsheets",    body: "Leave, payroll and headcount analytics in one place." },
];

/** Split screen: brand story on the left, the form on the right. */
export function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens where it would just push the form down */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <span className="text-base font-extrabold text-white">D</span>
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-tight text-white">Dayflow</p>
            <p className="text-[11px] text-brand-200">Every workday, perfectly aligned.</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[32px] font-bold leading-tight tracking-tight text-white">
            HR that runs itself, so your people can get on with the work.
          </h2>
          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">
                  <Icon className="size-[18px]" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-white">{title}</p>
                  <p className="text-[13px] leading-relaxed text-brand-100">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-brand-200">
          © 2026 Dayflow · Human Resource Management System
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
