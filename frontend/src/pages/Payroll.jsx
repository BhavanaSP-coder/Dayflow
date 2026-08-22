import { useMemo, useState } from "react";
import { Download, Pencil, Search, Wallet } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { Table, Td } from "../components/ui/Table";
import { money } from "../lib/format";
import { byId, employees, payroll, payrollFor, savePayroll } from "../data/store";

/** Employee view: read-only. HR/Admin view: table + edit. (SRS §3.6) */
export function Payroll({ user, isManager, onChanged }) {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payroll
      .map((p) => ({ ...p, emp: byId(p.employee_id) }))
      .filter((r) => !q || r.emp.name.toLowerCase().includes(q) || r.emp.code.toLowerCase().includes(q));
  }, [query, tick]);

  const totals = rows.reduce(
    (a, r) => ({ net: a.net + r.net_salary, basic: a.basic + r.basic_salary, count: a.count + 1 }),
    { net: 0, basic: 0, count: 0 }
  );

  if (!isManager) return <EmployeePayroll user={user} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Monthly wage bill", money(totals.net)],
          ["Employees paid", totals.count],
          ["Average net", money(Math.round(totals.net / (totals.count || 1)))],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="tnum mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Payroll"
          subtitle="August 2026 · update salary structures"
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employee…"
                className="h-8 w-48 rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-[13px] placeholder:text-slate-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
            </div>
          }
        />
        <div className="border-t border-hairline">
          <Table head={[
            { label: "Employee" }, { label: "Basic", align: "right" }, { label: "Allowances", align: "right" },
            { label: "Deductions", align: "right" }, { label: "Net", align: "right" }, { label: "", align: "right" },
          ]}>
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.emp.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{r.emp.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{r.emp.job_title}</p>
                    </div>
                  </div>
                </Td>
                <Td align="right"><span className="tnum">{money(r.basic_salary)}</span></Td>
                <Td align="right"><span className="tnum text-emerald-600">+{money(r.allowances)}</span></Td>
                <Td align="right"><span className="tnum text-rose-600">−{money(r.deductions)}</span></Td>
                <Td align="right"><span className="tnum font-bold text-slate-900">{money(r.net_salary)}</span></Td>
                <Td align="right">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
      </Card>

      <EditModal
        row={editing}
        actor={user}
        onClose={() => setEditing(null)}
        onDone={() => { setTick((t) => t + 1); onChanged?.(); }}
      />
    </div>
  );
}

function EmployeePayroll({ user }) {
  const slips = payrollFor(user.id);
  const current = slips[0];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Salary breakdown" subtitle="August 2026 · read-only" />
        <div className="px-5 py-5">
          {current ? (
            <>
              <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
                  <Wallet className="size-6" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-200">Net monthly pay</p>
                  <p className="tnum text-3xl font-bold tracking-tight text-white">{money(current.net_salary)}</p>
                </div>
              </div>
              <dl className="mt-5 divide-y divide-hairline">
                {[["Basic salary", current.basic_salary, "text-slate-800"],
                  ["Allowances", current.allowances, "text-emerald-600"],
                  ["Deductions", -current.deductions, "text-rose-600"]].map(([label, v, tone]) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <dt className="text-[13px] text-slate-600">{label}</dt>
                    <dd className={`tnum text-[14px] font-semibold ${tone}`}>
                      {v < 0 ? `− ${money(-v)}` : money(v)}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <dt className="text-[13px] font-bold text-slate-900">Net salary</dt>
                  <dd className="tnum text-[15px] font-bold text-slate-900">{money(current.net_salary)}</dd>
                </div>
              </dl>
              <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px] text-slate-500">
                Net = basic + allowances − deductions. Calculated by the server; if something looks wrong, contact HR.
              </p>
            </>
          ) : <p className="text-[13px] text-slate-500">No payroll record yet.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Payslips" subtitle="Last 3 months" />
        <ul className="divide-y divide-hairline border-t border-hairline">
          {["August 2026", "July 2026", "June 2026"].map((period, i) => (
            <li key={period} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-800">{period}</p>
                <p className="tnum text-[11px] text-slate-400">DF-PS-2026{String(8 - i).padStart(2, "0")}-000{user.id}</p>
              </div>
              <span className="tnum text-[13px] font-semibold text-slate-900">
                {money((current?.net_salary || 0) - i * 1240)}
              </span>
              <button className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-brand-600 group-hover:opacity-100" aria-label={`Download ${period} payslip`}>
                <Download className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function EditModal({ row, actor, onClose, onDone }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const active = row && (form?.id === row.id ? form : { ...row });

  if (!row) return null;
  const state = form?.id === row.id ? form : { ...row };
  const net = Number(state.basic_salary) + Number(state.allowances) - Number(state.deductions);
  const ownRecord = row.employee_id === actor.id;

  const set = (k) => (e) => { setForm({ ...state, [k]: Number(e.target.value || 0) }); setError(""); };

  const save = () => {
    if (ownRecord) return setError("You cannot modify your own payroll record.");
    if (net < 0) return setError("Deductions cannot exceed basic salary plus allowances.");
    if (state.basic_salary < 0 || state.allowances < 0 || state.deductions < 0)
      return setError("Amounts cannot be negative.");
    try {
      savePayroll(row.employee_id, {
        basic_salary: Number(state.basic_salary), allowances: Number(state.allowances),
        deductions: Number(state.deductions), month: row.month, year: row.year,
      });
      setForm(null); onDone(); onClose();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal
      open
      onClose={() => { setForm(null); setError(""); onClose(); }}
      title="Update salary structure"
      subtitle={`${byId(row.employee_id).name} · ${String(row.month).padStart(2, "0")}/${row.year}`}
      footer={
        <>
          <Button variant="secondary" onClick={() => { setForm(null); setError(""); onClose(); }}>Cancel</Button>
          <Button onClick={save} disabled={ownRecord}>Save changes</Button>
        </>
      }
    >
      {ownRecord && (
        <div className="mb-4 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
          This is your own record. Nobody — not even an admin — can edit their own payroll.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-3 text-[13px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <Field label="Basic salary" required>
          <Input type="number" min="0" value={state.basic_salary} onChange={set("basic_salary")} disabled={ownRecord} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Allowances"><Input type="number" min="0" value={state.allowances} onChange={set("allowances")} disabled={ownRecord} /></Field>
          <Field label="Deductions"><Input type="number" min="0" value={state.deductions} onChange={set("deductions")} disabled={ownRecord} /></Field>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-[13px] font-medium text-slate-600">Net salary</span>
          <span className={`tnum text-[17px] font-bold ${net < 0 ? "text-rose-600" : "text-slate-900"}`}>{money(net)}</span>
        </div>
        <p className="text-[12px] text-slate-500">
          Net is calculated, never entered — basic + allowances − deductions.
        </p>
      </div>
    </Modal>
  );
}
