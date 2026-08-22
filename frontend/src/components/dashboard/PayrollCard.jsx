import { ChevronRight, Download, Wallet } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { money } from "../../lib/format";

/**
 * Read-only payroll snapshot (SRS §3.6.1 — employees never edit salary).
 * There is deliberately no edit affordance anywhere in this component.
 */
export function PayrollCard({ payroll }) {
  return (
    <Card className="animate-rise">
      <CardHeader title="Payroll" subtitle="Read-only" />

      <div className="px-5 py-5">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/40 p-4 ring-1 ring-inset ring-hairline">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Last net pay
            </p>
            <p className="tnum text-2xl font-bold tracking-tight text-slate-900">
              {money(payroll.last_net, payroll.currency)}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1">
          {payroll.recent.map((slip) => (
            <li
              key={slip.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-800">{slip.period}</p>
                <p className="tnum truncate text-[11px] text-slate-400">{slip.name}</p>
              </div>
              <span className="tnum text-[13px] font-semibold text-slate-900">
                {money(slip.net, payroll.currency)}
              </span>
              <button
                className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-brand-600 group-hover:opacity-100"
                aria-label={`Download payslip ${slip.name}`}
              >
                <Download className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button className="flex w-full items-center justify-center gap-1 border-t border-hairline py-3 text-[13px] font-semibold text-brand-600 transition-colors hover:bg-brand-50/50">
        All payslips <ChevronRight className="size-3.5" />
      </button>
    </Card>
  );
}
