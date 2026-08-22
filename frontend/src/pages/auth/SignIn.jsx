import { useState } from "react";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { AuthLayout } from "./AuthLayout";
import { employees } from "../../data/store";

/**
 * Sign in.
 *
 * Validation is deliberately two-stage, matching the API: the form checks
 * shape (present, looks like an email) and the "server" check reports bad
 * credentials without saying which field was wrong — telling an attacker that
 * an email exists is a free hint.
 */
export function SignIn({ onSignedIn, onSwitch }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors((x) => ({ ...x, [k]: undefined }));
    setFormError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setTimeout(() => {
      const user = employees.find((u) => u.email.toLowerCase() === form.email.trim().toLowerCase());
      if (!user || form.password.length < 6) {
        setBusy(false);
        setFormError("Incorrect email or password.");
        return;
      }
      if (!user.active) {
        setBusy(false);
        setFormError("This account is not active yet. Check your email to verify it.");
        return;
      }
      onSignedIn(user);
    }, 500);
  };

  return (
    <AuthLayout>
      <div className="mb-7 lg:hidden">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
          <span className="text-base font-extrabold text-white">D</span>
        </div>
      </div>

      <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 text-[14px] text-slate-500">Sign in to your Dayflow workspace.</p>

      {formError && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 px-3.5 py-3 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <p className="text-[13px] font-medium text-rose-700">{formError}</p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <Field label="Email" required error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@dayflow.com"
            value={form.email}
            onChange={set("email")}
            invalid={!!errors.email}
          />
        </Field>

        <Field label="Password" required error={errors.password}>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              autoComplete="current-password"
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

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[13px] text-slate-600">
            <input type="checkbox" className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" />
            Remember me
          </label>
          <button type="button" className="text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Signing in…" : <><LogIn className="size-4" /> Sign in</>}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-500">
        New to Dayflow?{" "}
        <button onClick={onSwitch} className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </button>
      </p>

      {/* Demo helper — remove once the real API is wired in */}
      <div className="mt-7 rounded-xl border border-dashed border-slate-300 bg-white p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo accounts</p>
        <div className="mt-2 space-y-1.5">
          {[["arjun@dayflow.com", "Employee"], ["priya@dayflow.com", "HR"], ["rahul@dayflow.com", "Admin"]].map(
            ([email, role]) => (
              <button
                key={email}
                onClick={() => setForm({ email, password: "password" })}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-[12px] text-slate-600">{email}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{role}</span>
              </button>
            )
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Any password of 6+ characters.</p>
      </div>
    </AuthLayout>
  );
}
