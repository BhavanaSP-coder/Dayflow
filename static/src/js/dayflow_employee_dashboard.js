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
    formatHours as fmtHours,
    formatMoney,
} from "./dayflow_dashboard_common";

export class DayflowEmployeeDashboard extends Component {
    static template = "dayflow_hrms.EmployeeDashboard";
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.notification = useService("notification");

        this.state = useState({
            loading: true,
            data: null,
            busy: false,
            clock: currentClock(),
        });

        onWillStart(() => this.loadData());

        this.clockTimer = setInterval(() => {
            this.state.clock = currentClock();
        }, 30000);
        onWillUnmount(() => clearInterval(this.clockTimer));
    }

    // ------------------------------------------------------------------
    // Data
    // ------------------------------------------------------------------
    async loadData() {
        this.state.loading = true;
        try {
            this.state.data = await this.orm.call(
                "dayflow.dashboard",
                "get_employee_dashboard_data",
                []
            );
        } finally {
            this.state.loading = false;
        }
    }

    // ------------------------------------------------------------------
    // Formatting helpers exposed to the template
    // ------------------------------------------------------------------
    formatHours = fmtHours;
    formatDays = fmtDays;
    formatDate = fmtDate;

    avatar(employeeId) {
        return avatarUrl(employeeId);
    }

    money(value) {
        return formatMoney(value, this.state.data?.payroll?.currency);
    }

    statusClass(status) {
        return STATUS_CLASS[status] || "";
    }

    stateBadge(state) {
        return STATE_BADGE[state] || "text-bg-secondary";
    }

    dayClass(day) {
        const classes = ["o_dayflow_day"];
        if (day.is_weekend) {
            classes.push("is-weekend");
        }
        if (day.is_today) {
            classes.push("is-today");
        }
        if (day.status) {
            classes.push(STATUS_CLASS[day.status]);
        }
        return classes.join(" ");
    }

    balanceClass(balance) {
        if (balance.category === "sick") {
            return "o_dayflow_balance is-sick";
        }
        if (balance.category === "unpaid") {
            return "o_dayflow_balance is-unpaid";
        }
        return "o_dayflow_balance";
    }

    balanceWidth(balance) {
        if (!balance.allocated) {
            return "0%";
        }
        const ratio = Math.max(0, Math.min(balance.remaining / balance.allocated, 1));
        return `${Math.round(ratio * 100)}%`;
    }

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------
    get isCheckedIn() {
        return this.state.data?.attendance?.state === "checked_in";
    }

    async toggleAttendance() {
        if (this.state.busy) {
            return;
        }
        this.state.busy = true;
        const method = this.isCheckedIn ? "dashboard_check_out" : "dashboard_check_in";
        try {
            const result = await this.orm.call("dayflow.dashboard", method, []);
            if (result && result.params) {
                this.notification.add(result.params.message, {
                    title: result.params.title,
                    type: result.params.type || "success",
                });
            }
            await this.loadData();
        } finally {
            this.state.busy = false;
        }
    }

    openAction(xmlId, title) {
        this.action.doAction(xmlId, { additionalContext: { dayflow_title: title } });
    }

    openMyProfile() {
        const employeeId = this.state.data?.employee?.id;
        if (!employeeId) {
            return;
        }
        this.action.doAction({
            type: "ir.actions.act_window",
            name: _t("My Profile"),
            res_model: "dayflow.employee",
            res_id: employeeId,
            views: [[false, "form"]],
            target: "current",
        });
    }

    openMyAttendance() {
        this.openAction("dayflow_hrms.action_dayflow_my_attendance");
    }

    openMyLeaves() {
        this.openAction("dayflow_hrms.action_dayflow_my_leave");
    }

    openMyPayslips() {
        this.openAction("dayflow_hrms.action_dayflow_my_payslip");
    }

    openMyDocuments() {
        this.openAction("dayflow_hrms.action_dayflow_my_document");
    }

    newLeaveRequest() {
        const employeeId = this.state.data?.employee?.id;
        this.action.doAction({
            type: "ir.actions.act_window",
            name: _t("New Leave Request"),
            res_model: "dayflow.leave",
            views: [[false, "form"]],
            target: "current",
            context: { default_employee_id: employeeId },
        });
    }

    openPayslip(payslipId) {
        this.action.doAction({
            type: "ir.actions.act_window",
            name: _t("Payslip"),
            res_model: "dayflow.payslip",
            res_id: payslipId,
            views: [[false, "form"]],
            target: "current",
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

    logout() {
        window.location.href = "/web/session/logout";
    }
}

registry
    .category("actions")
    .add("dayflow_employee_dashboard", DayflowEmployeeDashboard);
