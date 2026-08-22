import { useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { AuthLayout } from "./AuthLayout";
import { employees } from "../../data/store";
import { cx } from "../../lib/status";

const RULES = [
  { key: "len",   label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter",  test: (v) => /[A-Z]/.test(v) },
  { key: "digit", label: "One number",            test: (v) => /\d/.test(v) },
  { key: "sym",   label: "One symbol",            test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function SignUp({ onSignedUp, onSwitch }) {
  const [form, setForm] = useState({
    employee_id: "", first_name: "", last_name: "", email: "",
    department: "Engineering", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors((x) => ({ ...x, [k]: undefined }));
    setFormError("");
  };

  const passed = RULES.filter((r) => r.test(form.password)).length;

  const submit = (e) => {
    e.preventDefault();
    const n = {};
    if (!form.employee_id.trim()) n.employee_id = "Employee ID is required";
    if (!form.first_name.trim()) n.first_name = "Required";
    if (!form.last_name.trim()) n.last_name = "Required";
    if (!form.email.trim()) n.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) n.email = "Enter a valid email address";
    else if (employees.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase()))
      n.email = "An account with this email already exists";
    if (passed < RULES.length) n.password = "Password does not meet all requirements";
    if (form.confirm !== form.password) n.confirm = "Passwords do not match";
    setErrors(n);
    if (Object.keys(n).length) return;

    setBusy(true);
    setTimeout(() => { setBusy(false); onSignedUp(form); }, 600);
  };

  return (
    <AuthLayout>
      <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1 text-[14px] text-slate-500">
        Your workspace admin assigns your role after you verify your email.
      </p>

      {formError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <p className="text-[13px] font-medium text-rose-700">{formError}</p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field label="Employee ID" required error={errors.employee_id} hint="From your offer letter">
          <Input placeholder="DF-EMP-1007" value={form.employee_id} onChange={set("employee_id")} invalid={!!errors.employee_id} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required error={errors.first_name}>
            <Input placeholder="Arjun" value={form.first_name} onChange={set("first_name")} invalid={!!errors.first_name} />
          </Field>
          <Field label="Last name" required error={errors.last_name}>
            <Input placeholder="Nair" value={form.last_name} onChange={set("last_name")} invalid={!!errors.last_name} />
          </Field>
        </div>

        <Field label="Work email" required error={errors.email}>
          <Input type="email" placeholder="you@dayflow.com" value={form.email} onChange={set("email")} invalid={!!errors.email} />
        </Field>

        <Field label="Department">
          <Select value={form.department} onChange={set("department")}>
            {["Engineering", "People", "Finance", "Leadership", "Operations"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              invalid={!!errors.password}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {/* Live strength meter — shows what's still missing rather than just "weak" */}
        {form.password && (
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex gap-1">
              {RULES.map((r, i) => (
                <span
                  key={r.key}
                  className={cx(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < passed ? (passed <= 2 ? "bg-rose-400" : passed === 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-1">
              {RULES.map((r) => {
                const ok = r.test(form.password);
                return (
                  <li key={r.key} className={cx("flex items-center gap-1.5 text-[11px]", ok ? "text-emerald-600" : "text-slate-400")}>
                    <Check className={cx("size-3", !ok && "opacity-30")} />
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Field label="Confirm password" required error={errors.confirm}>
          <Input type={show ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={set("confirm")} invalid={!!errors.confirm} />
        </Field>

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Creating account…" : <><UserPlus className="size-4" /> Create account</>}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        Already have an account?{" "}
        <button onClick={onSwitch} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</button>
      </p>
    </AuthLayout>
  );
}
