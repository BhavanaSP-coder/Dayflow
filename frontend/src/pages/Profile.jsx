import { useState } from "react";
import {
  Briefcase, Building2, Calendar, Check, Download, FileText, Mail,
  MapPin, Pencil, Phone, ShieldCheck, User, X,
} from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/ui/Field";
import { money } from "../lib/format";
import { cx } from "../lib/status";
import { payrollFor } from "../data/store";

const DOCUMENTS = [
  { name: "Offer letter.pdf",        size: "184 KB", date: "15 Jul 2024" },
  { name: "ID proof.pdf",            size: "1.2 MB", date: "15 Jul 2024" },
  { name: "Education certificate.pdf", size: "890 KB", date: "18 Jul 2024" },
];

/**
 * Profile.
 *
 * Employees may edit only phone and address (SRS §3.3.2) — every other field
 * is display-only here and changed by an admin through the employee endpoint.
 */
export function Profile({ user, canEditAll = false }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: user.phone, address: user.address });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const pay = payrollFor(user.id)[0];

  const save = () => {
    const n = {};
    if (!/^[\d+\-\s()]{7,20}$/.test(form.phone.trim())) n.phone = "Enter a valid phone number";
    if (form.address.trim().length < 8) n.address = "Address looks too short";
    setErrors(n);
    if (Object.keys(n).length) return;
    user.phone = form.phone;              // demo store is mutable
    user.address = form.address;
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Identity */}
      <Card className="overflow-hidden lg:col-span-1">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700" />
        <div className="-mt-10 px-5 pb-5">
          <div className="flex items-end gap-3">
            <Avatar name={user.name} size="lg" ring className="shadow-lift" />
            <button className="mb-1 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-white">
              Change photo
            </button>
          </div>
          <p className="mt-3 text-[17px] font-bold tracking-tight text-slate-900">{user.name}</p>
          <p className="text-[13px] text-slate-500">{user.job_title}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/20">{user.code}</Badge>
            <Badge tone={user.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-500 ring-slate-300"}
              dot={user.active ? "bg-emerald-500" : "bg-slate-400"}>
              {user.active ? "Active" : "Pending verification"}
            </Badge>
          </div>

          <dl className="mt-5 space-y-3 border-t border-hairline pt-4">
            {[
              [Mail, "Email", user.email],
              [Building2, "Department", user.department],
              [User, "Manager", user.manager],
              [Calendar, "Joined", user.joined],
              [ShieldCheck, "Role", user.role.toUpperCase()],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className="truncate text-[13px] text-slate-700">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-[11px] font-medium text-slate-500">Tenure</span>
            <span className="tnum text-[13px] font-bold text-slate-900">{user.tenure}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {/* Editable contact details */}
        <Card>
          <CardHeader
            title="Contact details"
            subtitle={canEditAll ? "Admins can edit every field" : "You can update your phone and address"}
            action={
              editing ? (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setErrors({}); setForm({ phone: user.phone, address: user.address }); }}>
                    <X className="size-3.5" /> Cancel
                  </Button>
                  <Button size="sm" onClick={save}><Check className="size-3.5" /> Save</Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )
            }
          />
          <div className="space-y-4 px-5 py-5">
            {saved && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <Check className="size-4" /> Your details were updated.
              </div>
            )}
            {editing ? (
              <>
                <Field label="Phone" required error={errors.phone}>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} invalid={!!errors.phone} />
                </Field>
                <Field label="Address" required error={errors.address}>
                  <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} invalid={!!errors.address} />
                </Field>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnly icon={Phone} label="Phone" value={user.phone} />
                <ReadOnly icon={MapPin} label="Address" value={user.address} />
              </div>
            )}
          </div>
        </Card>

        {/* Job + salary, both read-only for employees */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Job details" subtitle="Managed by HR" />
            <div className="space-y-4 px-5 py-5">
              <ReadOnly icon={Briefcase} label="Job title" value={user.job_title} />
              <ReadOnly icon={Building2} label="Department" value={user.department} />
              <ReadOnly icon={User} label="Reports to" value={user.manager} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Salary structure" subtitle="Read-only" />
            <div className="px-5 py-5">
              {pay ? (
                <>
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/40 p-4 ring-1 ring-inset ring-hairline">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Net monthly</p>
                    <p className="tnum text-2xl font-bold tracking-tight text-slate-900">{money(pay.net_salary)}</p>
                  </div>
                  <dl className="mt-4 space-y-2">
                    {[["Basic salary", pay.basic_salary], ["Allowances", pay.allowances], ["Deductions", -pay.deductions]].map(([label, v]) => (
                      <div key={label} className="flex items-center justify-between text-[13px]">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className={cx("tnum font-semibold", v < 0 ? "text-rose-600" : "text-slate-800")}>
                          {v < 0 ? `− ${money(-v)}` : money(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="text-[13px] text-slate-500">No payroll record yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Documents */}
        <Card>
          <CardHeader title="Documents" subtitle={`${DOCUMENTS.length} files`} />
          <ul className="divide-y divide-hairline border-t border-hairline">
            {DOCUMENTS.map((d) => (
              <li key={d.name} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                <span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-500">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-800">{d.name}</p>
                  <p className="text-[11px] text-slate-400">{d.size} · uploaded {d.date}</p>
                </div>
                <button className="rounded-lg p-2 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-brand-600 group-hover:opacity-100" aria-label={`Download ${d.name}`}>
                  <Download className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ReadOnly({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-[13px] text-slate-700">{value}</p>
      </div>
    </div>
  );
}
