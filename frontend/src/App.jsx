import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft, BarChart3, CalendarCheck, CircleUser, LayoutDashboard, Plane, Wallet,
} from "lucide-react";
import { AppShell } from "./layout/AppShell";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { HRDashboard } from "./pages/HRDashboard";
import { Leave } from "./pages/Leave";
import { Attendance } from "./pages/Attendance";
import { Profile } from "./pages/Profile";
import { Payroll } from "./pages/Payroll";
import { Reports } from "./pages/Reports";
import { SignIn } from "./pages/auth/SignIn";
import { SignUp } from "./pages/auth/SignUp";
import { Button } from "./components/ui/Button";
import { employeeDashboard } from "./data/employeeDashboard";
import { leaveBalances, leaveRequests, notificationsFor, payrollFor, attendanceFor } from "./data/store";

const TITLES = {
  dashboard: "Dashboard", profile: "My Profile", attendance: "Attendance",
  leave: "Leave & Time-off", payroll: "Payroll", reports: "Reports",
};

/** Nav is built from the role — an employee never even sees Reports. */
function navFor(role, pendingForMe) {
  const isManager = role === "hr" || role === "admin";
  return [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "profile", label: "Profile", icon: CircleUser },
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "leave", label: "Leave", icon: Plane, badge: pendingForMe || undefined },
    { key: "payroll", label: "Payroll", icon: Wallet },
    ...(isManager ? [{ key: "reports", label: "Reports", icon: BarChart3 }] : []),
  ];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("signin");
  const [view, setView] = useState("dashboard");
  const [viewingEmployee, setViewingEmployee] = useState(null);  // HR looking at someone else
  const [tick, setTick] = useState(0);

  const bump = useCallback(() => setTick((t) => t + 1), []);
  const isManager = user?.role === "hr" || user?.role === "admin";

  const pending = useMemo(() => {
    if (!user) return 0;
    return isManager
      ? leaveRequests.filter((l) => l.status === "pending").length
      : leaveRequests.filter((l) => l.employee_id === user.id && l.status === "pending").length;
  }, [user, isManager, tick]);

  const unread = useMemo(
    () => (user ? notificationsFor(user.id).filter((n) => !n.is_read).length : 0),
    [user, tick]
  );

  /* ------------------------------- signed out ------------------------------ */
  if (!user) {
    return authView === "signin" ? (
      <SignIn onSignedIn={(u) => { setUser(u); setView("dashboard"); }} onSwitch={() => setAuthView("signup")} />
    ) : (
      <SignUp
        onSignedUp={() => setAuthView("signin")}
        onSwitch={() => setAuthView("signin")}
      />
    );
  }

  /* -------------------------------- signed in ------------------------------ */
  // Dashboard data, rebuilt from the store so it reflects live mutations.
  const dashData = {
    ...employeeDashboard,
    employee: {
      ...employeeDashboard.employee,
      id: user.id, name: user.name, code: user.code, job_title: user.job_title,
      department: user.department, manager: user.manager, email: user.email, phone: user.phone,
      tenure: user.tenure,
    },
    leave: {
      pending_count: pending,
      balance_total: leaveBalances(user.id).reduce((a, b) => a + b.remaining, 0),
      balances: leaveBalances(user.id),
      recent: leaveRequests.filter((l) => l.employee_id === user.id).slice(0, 4),
    },
    payroll: {
      last_net: payrollFor(user.id)[0]?.net_salary ?? 0,
      currency: "₹",
      recent: payrollFor(user.id).map((p) => ({
        id: p.id, name: `DF-PS-${p.year}${String(p.month).padStart(2, "0")}-000${user.id}`,
        period: `August ${p.year}`, net: p.net_salary, state: "paid",
      })),
    },
    alerts: notificationsFor(user.id).slice(0, 4).map((n) => ({
      type: n.type.includes("APPROVED") ? "success" : n.type.includes("REJECTED") ? "danger" : "info",
      icon: n.icon, title: n.title, message: n.message, time: n.time,
    })),
  };

  const subject = viewingEmployee ?? user;

  const body = () => {
    // HR drilled into a specific employee from the directory
    if (viewingEmployee) {
      return (
        <div className="space-y-5">
          <Button variant="secondary" size="sm" onClick={() => setViewingEmployee(null)}>
            <ArrowLeft className="size-3.5" /> Back to directory
          </Button>
          <Profile user={viewingEmployee} canEditAll={user.role === "admin"} />
        </div>
      );
    }

    switch (view) {
      case "dashboard":
        return isManager ? (
          <HRDashboard
            refreshKey={tick}
            onNavigate={setView}
            onOpenEmployee={(e) => { setViewingEmployee(e); setView("profile"); }}
          />
        ) : (
          <EmployeeDashboard data={dashData} onNavigate={setView} onLogout={() => setUser(null)} />
        );
      case "profile":    return <Profile user={subject} canEditAll={user.role === "admin"} />;
      case "attendance": return <Attendance user={user} isManager={isManager} />;
      case "leave":      return <Leave user={user} isManager={isManager} onChanged={bump} />;
      case "payroll":    return <Payroll user={user} isManager={isManager} onChanged={bump} />;
      case "reports":    return <Reports refreshKey={tick} />;
      default:           return null;
    }
  };

  return (
    <AppShell
      user={user}
      nav={navFor(user.role, pending)}
      current={view}
      onNavigate={(k) => { setViewingEmployee(null); setView(k); }}
      title={viewingEmployee ? viewingEmployee.name : TITLES[view]}
      unread={unread}
      onLogout={() => { setUser(null); setView("dashboard"); setViewingEmployee(null); }}
    >
      {body()}
    </AppShell>
  );
}
