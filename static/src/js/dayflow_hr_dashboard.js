/** @odoo-module **/

import { Component, onWillStart, onWillUnmount, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

import {
    STATUS_CLASS,
    STATE_BADGE,
    avatarUrl,
    currentClock,
    formatDate as fmtDate,
    formatDays as fmtDays,
    formatMoney,
} from "./dayflow_dashboard_common";

export class DayflowHrDashboard extends Component {
    static template = "dayflow_hrms.HrDashboard";
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.notification = useService("notification");

        this.state = useState({
            loading: true,
            data: null,
            busy: false,
            search: "",
            clock: currentClock(),
        });

        onWillStart(() => this.loadData());

        this.clockTimer = setInterval(() => {
            this.state.clock = currentClock();
        }, 30000);
        onWillUnmount(() => clearInterval(this.clockTimer));
    }

    async loadData() {
        this.state.loading = true;
        try {
            this.state.data = await this.orm.call(
                "dayflow.dashboard",
                "get_hr_dashboard_data",
                []
            );
        } finally {
            this.state.loading = false;
        }
    }

    // ------------------------------------------------------------------
    // Formatting
    // ------------------------------------------------------------------
    formatDate = fmtDate;
    formatDays = fmtDays;

    avatar(employeeId) {
        return avatarUrl(employeeId);
    }

    money(value) {
        return formatMoney(value, this.state.data?.kpi?.currency);
    }

    statusClass(status) {
        return STATUS_CLASS[status] || "";
    }

    stateBadge(state) {
        return STATE_BADGE[state] || "text-bg-secondary";
    }

    // ------------------------------------------------------------------
    // Quick switch between employees
    // ------------------------------------------------------------------
    get filteredDirectory() {
        const directory = this.state.data?.directory || [];
        const term = this.state.search.trim().toLowerCase();
        if (!term) {
            return directory.slice(0, 8);
        }
        return directory
            .filter((employee) => {
                const haystack = `${employee.name} ${employee.code || ""} ${
                    employee.job_title || ""
                } ${employee.department || ""}`.toLowerCase();
                return haystack.includes(term);
            })
            .slice(0, 8);
    }

    openEmployee(employeeId) {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: _t("Employee"),
            res_model: "dayflow.employee",
            res_id: employeeId,
            views: [[false, "form"]],
            target: "current",
        });
    }

    // ------------------------------------------------------------------
    // Approvals straight from the dashboard
    // ------------------------------------------------------------------
    async approveLeave(leaveId) {
        if (this.state.busy) {
            return;
        }
        this.state.busy = true;
        try {
            await this.orm.call("dayflow.dashboard", "dashboard_approve_leave", [leaveId]);
            this.notification.add(_t("Leave approved."), { type: "success" });
            await this.loadData();
        } finally {
            this.state.busy = false;
        }
    }

    rejectLeave(leaveId) {
        // Reuse the standard rejection wizard so a reason is always captured.
        this.action.doAction(
            {
                type: "ir.actions.act_window",
                name: _t("Reject Leave Request"),
                res_model: "dayflow.leave.refuse",
                views: [[false, "form"]],
                target: "new",
                context: { default_leave_ids: [[6, 0, [leaveId]]] },
            },
            { onClose: () => this.loadData() }
        );
    }

    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------
    openAction(xmlId) {
        this.action.doAction(xmlId);
    }

    openEmployees() {
        this.openAction("dayflow_hrms.action_dayflow_employee");
    }

    openAttendance() {
        this.openAction("dayflow_hrms.action_dayflow_attendance");
    }

    openApprovals() {
        this.openAction("dayflow_hrms.action_dayflow_leave_approval");
    }

    openPayroll() {
        this.openAction("dayflow_hrms.action_dayflow_payslip");
    }

    openDepartments() {
        this.openAction("dayflow_hrms.action_dayflow_department");
    }

    openReports() {
        this.openAction("dayflow_hrms.action_dayflow_report_attendance");
    }

    generatePayslips() {
        this.action.doAction("dayflow_hrms.action_dayflow_payslip_batch", {
            onClose: () => this.loadData(),
        });
    }

    openLeave(leaveId) {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: _t("Leave Request"),
            res_model: "dayflow.leave",
            res_id: leaveId,
            views: [[false, "form"]],
            target: "current",
        });
    }
}

registry.category("actions").add("dayflow_hr_dashboard", DayflowHrDashboard);
