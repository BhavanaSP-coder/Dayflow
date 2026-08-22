"""Pydantic response schemas for Reports. All read-only - no input schemas."""

from decimal import Decimal

from pydantic import BaseModel


class LeaveReportOut(BaseModel):
    """Answers: how much leave, in what state, of what kind?"""

    total_requests: int
    pending: int
    approved: int
    rejected: int
    approval_rate: float          # approved / decided, as a percentage
    total_days_approved: int
    by_type: dict[str, int]       # {"SICK": 4, "CASUAL": 9, ...}
    employees_with_leave: int


class PayrollReportOut(BaseModel):
    """Answers: what is the wage bill and how is it distributed?"""

    records: int
    employees_paid: int
    total_net_salary: Decimal
    total_basic_salary: Decimal
    total_allowances: Decimal
    total_deductions: Decimal
    average_net_salary: Decimal
    highest_net_salary: Decimal
    lowest_net_salary: Decimal
    by_period: dict[str, Decimal]  # {"2026-08": 145000.00, ...}


class EmployeeReportOut(BaseModel):
    """Headcount and department split from the employees table."""

    headcount: int
    active: int
    inactive: int
    by_department: dict[str, int]     # {"Engineering": 4, "Unassigned": 1}
    employees_with_payroll: int
    employees_with_leave: int


class AttendanceReportOut(BaseModel):
    """Attendance summary. Half-days count as 0.5 toward the rate."""

    total_records: int
    present: int
    absent: int
    half_day: int
    leave: int
    employees_tracked: int
    attendance_rate: float
