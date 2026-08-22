/** @odoo-module **/

/**
 * Shared helpers for the two Dayflow OWL dashboards.
 */

export const STATUS_CLASS = {
    present: "is-present",
    half_day: "is-half_day",
    absent: "is-absent",
    leave: "is-leave",
};

export const STATE_BADGE = {
    draft: "text-bg-secondary",
    to_approve: "text-bg-warning",
    approved: "text-bg-success",
    rejected: "text-bg-danger",
    cancelled: "text-bg-secondary",
};

/** Format a float number of hours as "7h 30". */
export function formatHours(value) {
    const total = Math.max(Number(value) || 0, 0);
    const hours = Math.floor(total);
    const minutes = Math.round((total - hours) * 60);
    return `${hours}h ${String(minutes).padStart(2, "0")}`;
}

/** Format a number with at most one decimal, dropping a trailing ".0". */
export function formatDays(value) {
    const number = Number(value) || 0;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

/** "12 Mar 2026" from an ISO date string. */
export function formatDate(isoDate) {
    if (!isoDate) {
        return "";
    }
    const date = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return isoDate;
    }
    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/** Money with the company symbol in front. */
export function formatMoney(value, symbol) {
    const number = Number(value) || 0;
    const formatted = number.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return symbol ? `${symbol} ${formatted}` : formatted;
}

/** Current wall clock, refreshed by the dashboards every 30 seconds. */
export function currentClock() {
    const now = new Date();
    return {
        time: now.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        }),
        date: now.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
        }),
    };
}

/** Build the URL of an employee avatar served by the web image controller. */
export function avatarUrl(employeeId) {
    if (!employeeId) {
        return "/web/static/img/placeholder.png";
    }
    return `/web/image/dayflow.employee/${employeeId}/image_128`;
}
