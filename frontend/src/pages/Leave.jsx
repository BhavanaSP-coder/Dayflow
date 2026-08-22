import { useMemo, useState } from "react";
import { CalendarDays, Check, Plus, X } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Table, Td } from "../components/ui/Table";
import { Avatar } from "../components/ui/Avatar";
import { LEAVE_STATUS, cx } from "../lib/status";
import {
  LEAVE_TYPES, applyForLeave, byId, decideLeave, leaveBalances, leaveRequests,
} from "../data/store";

const CATEGORY_TONE = { paid: "bg-brand-600", sick: "bg-emerald-500", unpaid: "bg-slate-400" };
const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function Leave({ user, isManager, onChanged }) {
  const [tab, setTab] = useState(isManager ? "pending" : "all");
  const [applyOpen, setApplyOpen] = useState(false);
  const [decision, setDecision] = useState(null);   // { row, action }
  const [tick, setTick] = useState(0);              // re-read the store after a mutation

  const rows = useMemo(() => {
    const base = isManager ? leaveRequests : leaveRequests.filter((l) => l.employee_id === user.id);
    return tab === "all" ? base : base.filter((l) => l.status === tab);
  }, [tab, isManager, user.id, tick]);

  const balances = useMemo(() => leaveBalances(user.id), [user.id, tick]);
  const refresh = () => { setTick((t) => t + 1); onChanged?.(); };

  return (
    <div className="space-y-6">
      {/* Balances — employees only; a manager's own balance isn't the point here */}
      {!isManager && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {balances.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-slate-700">{b.name}</p>
                <p className="tnum text-[15px] font-bold text-slate-900">
                  {b.remaining}
                  <span className="text-[12px] font-normal text-slate-400">
                    {b.allocated > 0 ? ` / ${b.allocated}` : " days"}
                  </span>
                </p>
              </div>
              <ProgressBar className="mt-2.5" value={b.taken + b.pending} max={Math.max(b.allocated, b.taken + b.pending, 1)} tone={CATEGORY_TONE[b.category]} />
              <p className="mt-2 text-[11px] text-slate-500">
                {b.taken} taken · {b.pending} pending
              </p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title={isManager ? "Leave requests" : "My leave requests"}
          subtitle={isManager ? "Approve or reject with a comment" : "Track the status of everything you've applied for"}
          action={!isManager && (
            <Button size="sm" onClick={() => setApplyOpen(true)}>
              <Plus className="size-3.5" /> Apply for leave
            </Button>
          )}
        />

        <div className="flex gap-1 px-5 pt-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                tab === t.key ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 border-t border-hairline">
          {rows.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing here"
              message={tab === "pending" ? "No requests are waiting on a decision." : "No leave requests match this filter."}
            />
          ) : (
            <Table
              head={[
                ...(isManager ? [{ label: "Employee" }] : []),
                { label: "Type" }, { label: "Dates" }, { label: "Days", align: "right" },
                { label: "Status" }, { label: isManager ? "Action" : "Comment", align: "right" },
              ]}
            >
              {rows.map((r) => {
                const meta = LEAVE_STATUS[r.status];
                const emp = byId(r.employee_id);
                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                    {isManager && (
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={emp.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">{emp.name}</p>
                            <p className="tnum truncate text-[11px] text-slate-400">{emp.code}</p>
                          </div>
                        </div>
                      </Td>
                    )}
                    <Td>
                      <p className="font-medium text-slate-800">{r.type}</p>
                      {r.remarks && <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-400">{r.remarks}</p>}
                    </Td>
                    <Td><span className="tnum">{r.from} → {r.to}</span></Td>
                    <Td align="right"><span className="tnum font-semibold">{r.days}</span></Td>
                    <Td><Badge tone={meta.chip} dot={meta.dot}>{meta.label}</Badge></Td>
                    <Td align="right">
                      {isManager && r.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => setDecision({ row: r, action: "approved" })}>
                            <Check className="size-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setDecision({ row: r, action: "rejected" })}>
                            <X className="size-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">{r.admin_comment || "—"}</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      </Card>

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} user={user} onDone={refresh} />
      <DecisionModal decision={decision} onClose={() => setDecision(null)} reviewer={user} onDone={refresh} />
    </div>
  );
}

/* ----------------------------- apply for leave ----------------------------- */
function ApplyModal({ open, onClose, user, onDone }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ code: "PAID", from: "", to: "", remarks: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({}); setFormError(""); };

  const days = form.from && form.to
    ? Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1 : 0;

  const submit = (e) => {
    e.preventDefault();
    const n = {};
    if (!form.from) n.from = "Required";
    if (!form.to) n.to = "Required";
    if (form.from && form.to && new Date(form.from) > new Date(form.to)) n.to = "End date is before the start date";
    if (form.from && form.from < today) n.from = "Cannot apply for a date in the past";
    if (days > 90) n.to = "Leave cannot exceed 90 days";
    setErrors(n);
    if (Object.keys(n).length) return;
    try {
      applyForLeave({ employee_id: user.id, ...form });
      setForm({ code: "PAID", from: "", to: "", remarks: "" });
      onDone(); onClose();
    } catch (err) {
      setFormError(err.message);          // overlap and other business rules
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply for leave"
      subtitle="Your request goes to HR as Pending"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Submit request</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div className="rounded-xl bg-rose-50 px-3.5 py-3 text-[13px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
            {formError}
          </div>
        )}

        <Field label="Leave type" required>
          <Select value={form.code} onChange={set("code")}>
            {LEAVE_TYPES.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="From" required error={errors.from}>
            <Input type="date" min={today} value={form.from} onChange={set("from")} invalid={!!errors.from} />
          </Field>
          <Field label="To" required error={errors.to}>
            <Input type="date" min={form.from || today} value={form.to} onChange={set("to")} invalid={!!errors.to} />
          </Field>
        </div>

        {days > 0 && !errors.to && (
          <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-[13px] font-medium text-brand-700">
            {days} {days === 1 ? "day" : "days"} — inclusive of both dates
          </div>
        )}

        <Field label="Remarks" hint="Optional">
          <Textarea placeholder="Anything HR should know…" value={form.remarks} onChange={set("remarks")} maxLength={500} />
        </Field>
      </form>
    </Modal>
  );
}

/* -------------------------- approve / reject modal -------------------------- */
function DecisionModal({ decision, onClose, reviewer, onDone }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  if (!decision) return null;
  const { row, action } = decision;
  const rejecting = action === "rejected";

  const confirm = () => {
    try {
      decideLeave(row.id, action, comment, reviewer.id);
      setComment(""); setError(""); onDone(); onClose();
    } catch (e) { setError(e.message); }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={rejecting ? "Reject leave request" : "Approve leave request"}
      subtitle={`${byId(row.employee_id).name} · ${row.type} · ${row.from} → ${row.to}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={rejecting ? "danger" : "primary"} onClick={confirm}>
            {rejecting ? "Reject request" : "Approve request"}
          </Button>
        </>
      }
    >
      <Field
        label="Comment"
        required={rejecting}
        hint={rejecting ? "" : "Optional"}
        error={error}
      >
        <Textarea
          autoFocus
          placeholder={rejecting ? "Why is this being rejected?" : "Anything to add?"}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError(""); }}
          invalid={!!error}
        />
      </Field>
      {rejecting && (
        <p className="mt-2 text-[12px] text-slate-500">
          The employee sees this comment on their request, so keep it useful.
        </p>
      )}
    </Modal>
  );
}
