import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { LeaveSummary } from "../components/dashboard/LeaveSummary";
import { PayrollCard } from "../components/dashboard/PayrollCard";
import { ProfileCard } from "../components/dashboard/ProfileCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import { TodayCard } from "../components/dashboard/TodayCard";
import { WeekStrip } from "../components/dashboard/WeekStrip";

/**
 * Employee Dashboard — SRS §3.2.1.
 *
 * Composition only: this page decides what goes where and passes data down.
 * Every piece of markup lives in a component under components/dashboard, so
 * the same pieces can be rearranged for the HR dashboard later.
 *
 * To go live, replace the `data` prop with a fetch — the mock in
 * data/employeeDashboard.js already matches the backend contract.
 */
export function EmployeeDashboard({ data, onNavigate, onLogout }) {
  const { employee, attendance, leave, payroll, alerts } = data;

  // The contract's documented empty state (§1.1).
  if (!data.has_profile) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
        <div>
          <p className="text-[15px] font-semibold text-slate-900">No employee profile linked</p>
          <p className="mt-1 text-[13px] text-slate-500">
            Ask your HR administrator to connect your account to an employee record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TodayCard employee={employee} attendance={attendance} />

      <QuickActions onNavigate={onNavigate} onLogout={onLogout} pending={leave.pending_count} />

      {/* 12-column split: the working columns get 8, the identity rail gets 4. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <WeekStrip
            week={attendance.week}
            monthLabel={attendance.month_label}
            month={attendance.month}
          />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LeaveSummary leave={leave} onApply={() => onNavigate("leave")} />
            <PayrollCard payroll={payroll} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <ProfileCard employee={employee} onOpen={() => onNavigate("profile")} />
          <ActivityFeed alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
