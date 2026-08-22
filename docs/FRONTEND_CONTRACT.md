# Dayflow HRMS — Frontend ↔ Backend Contract

**Audience:** whoever is building the models, controllers and security.
**Purpose:** the frontend (views, OWL dashboards, SCSS, reports) binds to the
names below. Keep them and the UI works untouched. Change one and something
breaks — usually loudly at module install, sometimes silently at runtime.

> The field tables at the bottom are **generated from the views themselves**, so
> they cannot drift from what the UI actually binds to. Regenerate after any
> view change.

---

## 1. The dashboard seam

The two OWL dashboards never read models directly. They call **six methods** on
an `AbstractModel` named `dayflow.dashboard`, and nothing else. This is the
cleanest boundary in the project — honour these six signatures and the
dashboards work against any implementation.

```python
class DayflowDashboard(models.AbstractModel):
    _name = "dayflow.dashboard"

    @api.model
    def get_employee_dashboard_data(self): ...     # dict, shape in §1.1
    @api.model
    def get_hr_dashboard_data(self): ...           # dict, shape in §1.2
    @api.model
    def dashboard_check_in(self): ...              # notification dict, §1.3
    @api.model
    def dashboard_check_out(self): ...             # notification dict, §1.3
    @api.model
    def dashboard_approve_leave(self, leave_id): ...          # -> True
    @api.model
    def dashboard_reject_leave(self, leave_id, comment=None): # -> True
```

Everything returned must be **JSON-serialisable** — no recordsets, no
`datetime` objects. Dates go out as `"YYYY-MM-DD"` strings, times as `"HH:MM"`.

### 1.1 `get_employee_dashboard_data()`

If the signed-in user has no employee profile, return `{"has_profile": false}`
and nothing else — the UI renders a dedicated empty state for that case.

```jsonc
{
  "has_profile": true,
  "employee": {
    "id": 7,                    // int — also used to build the avatar URL
    "name": "Arjun Nair",
    "code": "DF-EMP-1002",
    "job_title": "Senior Backend Engineer",
    "department": "Engineering", // plain string, never a [id, name] pair
    "manager": "Priya Menon",
    "email": "arjun.dev@dayflow.test",
    "phone": "+91 98450 11002",
    "tenure": "2 y 1 m",         // pre-formatted; the UI prints it verbatim
    "status": "confirmed"
  },
  "attendance": {
    "state": "checked_in",           // "checked_in" | "checked_out"
    "checked_in_since": "09:12",     // "HH:MM" or false
    "today_hours": 3.4,              // float hours
    "today_status": "present",       // status enum (§2) or false
    "month": {                       // counts for the current month
      "present": 14, "absent": 1, "half_day": 2, "leave": 3,
      "worked_hours": 118.5
    },
    "month_label": "August 2026",
    "week": [                        // EXACTLY 7 entries, Monday first
      {
        "date": "2026-08-17",
        "label": "Mon",              // short weekday name
        "day_number": 17,
        "is_today": false,
        "is_weekend": false,
        "is_future": false,
        "status": "present",         // status enum (§2) or false
        "status_label": "Present",   // human label, "" when no record
        "hours": 8.5
      }
      // ... 6 more
    ]
  },
  "leave": {
    "pending_count": 1,
    "balance_total": 12.5,           // float, days
    "balances": [                    // one entry per leave type
      {
        "id": 1, "name": "Paid Time Off", "code": "PTO",
        "category": "paid",          // category enum (§2)
        "allocated": 18.0, "taken": 5.5, "pending": 3.0, "remaining": 12.5
      }
    ],
    "recent": [ /* leave objects, §1.4 — most recent first, max ~6 */ ]
  },
  "payroll": {
    "last_net": 91480.0,
    "currency": "₹",                 // symbol only, not the currency id
    "recent": [
      { "id": 3, "name": "DF-PS-202607-0002", "period": "July 2026",
        "net": 91480.0, "state": "paid" }
    ]
  },
  "alerts": [                        // never empty — send an "all clear" entry
    { "type": "success",             // success | warning | danger | info
      "icon": "fa-check-circle",     // Font Awesome 4 class, no "fa " prefix
      "title": "Leave approved",
      "message": "DF-LV-2026-00004 was approved by Priya Menon" }
  ]
}
```

### 1.2 `get_hr_dashboard_data()`

Must raise `AccessError` if the caller is not in `group_dayflow_hr`.

```jsonc
{
  "kpi": {
    "headcount": 7, "present_today": 5, "half_day_today": 1,
    "on_leave_today": 1, "absent_today": 0,
    "attendance_rate": 78.6,          // percent, one decimal
    "pending_leaves": 3,
    "payroll_total": 421900.0, "payroll_count": 7,
    "currency": "₹", "month_label": "August 2026", "new_joiners": 1
  },
  "today_breakdown": [                // EXACTLY these 4 keys, in this order
    { "key": "present",  "label": "Present",  "count": 5, "percent": 71.4 },
    { "key": "half_day", "label": "Half-day", "count": 1, "percent": 14.3 },
    { "key": "leave",    "label": "Leave",    "count": 1, "percent": 14.3 },
    { "key": "absent",   "label": "Absent",   "count": 0, "percent": 0.0 }
  ],
  "pending_leaves": [ /* leave objects, §1.4 — oldest start date first */ ],
  "departments": [
    { "id": 2, "name": "Engineering", "count": 4, "percent": 57.1 }
  ],
  "attendance_trend": [               // EXACTLY 14 entries, oldest first
    { "date": "2026-08-09", "label": "09/08", "short": "S",
      "value": 0,                     // head-count present that day
      "height": 0,                    // 0-100, pre-scaled to the peak
      "is_weekend": true }
  ],
  "directory": [                      // powers the quick-switch search
    { "id": 7, "name": "Arjun Nair", "code": "DF-EMP-1002",
      "job_title": "Senior Backend Engineer", "department": "Engineering" }
  ]
}
```

`height` is deliberately computed server-side: the bars are pure CSS, so the
backend owns the scaling. Send `0–100`, already divided by the peak value.

### 1.3 Check in / check out

Both return a standard Odoo notification action. The UI reads
`result.params.title`, `.message` and `.type`:

```python
{"type": "ir.actions.client", "tag": "display_notification",
 "params": {"title": "Checked in", "message": "Have a great day, Arjun!",
            "type": "success", "sticky": False}}
```

Raise `UserError` for the failure cases (already checked in, nothing to close,
punching someone else's clock) — the web client surfaces those on its own.

### 1.4 The shared `leave` object

Used by both dashboards. Every key is required.

```jsonc
{
  "id": 12,
  "name": "DF-LV-2026-00012",     // human reference
  "employee_id": 7,               // int — used for the avatar URL
  "employee_name": "Arjun Nair",
  "type_name": "Paid Time Off",
  "category": "paid",             // category enum (§2)
  "date_from": "2026-09-03",
  "date_to": "2026-09-05",
  "duration": 3.0,                // float days
  "state": "to_approve",          // state enum (§2)
  "state_label": "Pending",       // human label
  "remarks": ""                   // "" not null
}
```

---

## 2. Enums that must match exactly

The frontend maps these **raw values** to CSS class names and colours. A
different spelling silently renders unstyled.

| Concept | Field | Allowed values |
| --- | --- | --- |
| Attendance status | `dayflow.attendance.status` | `present` · `half_day` · `absent` · `leave` |
| Leave state | `dayflow.leave.state` | `draft` · `to_approve` · `approved` · `rejected` · `cancelled` |
| Leave category | `dayflow.leave.type.category` | `paid` · `sick` · `unpaid` |
| Payslip state | `dayflow.payslip.state` | `draft` · `computed` · `confirmed` · `paid` · `cancelled` |
| Employment status | `dayflow.employee.employee_status` | `probation` · `confirmed` · `notice` · `exited` |
| Employment type | `dayflow.employee.employment_type` | `full_time` · `part_time` · `contract` · `intern` |
| Attendance state | `dayflow.employee.attendance_state` | `checked_in` · `checked_out` |
| Salary rule kind | `dayflow.salary.line.rule_type` | `earning` · `deduction` |
| Document state | `dayflow.document.state` | `valid` · `expiring` · `expired` |
| Dayflow role | `res.users.dayflow_role` | `employee` · `hr` |

Note `to_approve`, not `pending` — "Pending" is only the display label.

---

## 3. Other names the frontend hard-codes

**Security groups** — referenced in `groups=` attributes across the views and
in `_compute_can_edit_all` / `_compute_can_approve`:

* `dayflow_hrms.group_dayflow_employee`
* `dayflow_hrms.group_dayflow_hr`

**Client action tags** — registered in the OWL action registry:

* `dayflow_employee_dashboard`
* `dayflow_hr_dashboard`

**Avatar URL** — the dashboards build `/web/image/dayflow.employee/<id>/image_128`
directly, so `dayflow.employee` **must** inherit `image.mixin`.

**Wizard model** — the HR dashboard's reject button opens
`dayflow.leave.refuse` with `default_leave_ids` as `[[6, 0, [leave_id]]]`, and
expects a `reason` field plus an `action_confirm_reject()` method.

**Model methods called from view buttons** (`type="object"`):

| Model | Methods |
| --- | --- |
| `dayflow.employee` | `action_check_in` `action_check_out` `action_open_attendance` `action_open_leaves` `action_open_payslips` `action_open_documents` `action_open_my_profile` |
| `dayflow.attendance` | `action_check_out_now` |
| `dayflow.leave` | `action_submit` `action_approve` `action_open_reject_wizard` `action_cancel` `action_reset_to_draft` |
| `dayflow.payslip` | `action_compute_sheet` `action_confirm` `action_mark_paid` `action_cancel` `action_reset_to_draft` `action_print_payslip` |
| `dayflow.department` | `action_open_employees` |

**Helper fields the views use for conditional read-only** — these are UI
affordances, not security. Security still has to be enforced in `write()`:

* `dayflow.employee.can_edit_all` — true for HR
* `dayflow.leave.can_edit`, `dayflow.leave.can_approve`

---

## 4. Field bindings, per model

Generated from the view definitions. Every field below is bound by at least one
view; removing or renaming one breaks that view at install time.

<!-- BEGIN GENERATED -->

### `dayflow.employee`

| Field | Type | Notes |
| --- | --- | --- |
| `active` | Boolean | — |
| `age` | Integer | computed |
| `attendance_count` | Integer | computed |
| `attendance_ids` | One2many → `dayflow.attendance` | — |
| `attendance_state` | Selection | computed · values: `checked_in`, `checked_out` |
| `bank_account_number` | Char | — |
| `bank_name` | Char | — |
| `basic_salary` | Monetary | — |
| `birthday` | Date | — |
| `can_edit_all` | Boolean | computed |
| `city` | Char | — |
| `color` | Integer | — |
| `company_id` | Many2one → `res.company` | required |
| `country_id` | Many2one → `res.country` | — |
| `currency_id` | Many2one → `res.currency` | related `company_id.currency_id` |
| `date_exit` | Date | — |
| `date_joined` | Date | — |
| `department_id` | Many2one → `dayflow.department` | — |
| `document_count` | Integer | computed |
| `document_ids` | One2many → `dayflow.document` | — |
| `emergency_contact_name` | Char | — |
| `emergency_contact_phone` | Char | — |
| `employee_code` | Char | — |
| `employee_status` | Selection | values: `probation`, `confirmed`, `notice`, `exited` |
| `employment_type` | Selection | values: `full_time`, `part_time`, `contract`, `intern` |
| `gender` | Selection | values: `male`, `female`, `other`, `na` |
| `gross_salary` | Monetary | computed |
| `identification_id` | Char | — |
| `is_hr_officer` | Boolean | computed |
| `job_title` | Char | — |
| `leave_balance` | Float | computed |
| `leave_count` | Integer | computed |
| `leave_ids` | One2many → `dayflow.leave` | — |
| `manager_id` | Many2one → `dayflow.employee` | — |
| `marital` | Selection | values: `single`, `married`, `cohabitant`, `widower`, `divorced` |
| `mobile` | Char | — |
| `name` | Char | required |
| `nationality_id` | Many2one → `res.country` | — |
| `net_salary` | Monetary | computed |
| `payslip_count` | Integer | computed |
| `pending_leave_count` | Integer | computed |
| `phone` | Char | — |
| `private_email` | Char | — |
| `state_id` | Many2one → `res.country.state` | — |
| `street` | Char | — |
| `street2` | Char | — |
| `structure_id` | Many2one → `dayflow.salary.structure` | — |
| `subordinate_count` | Integer | computed |
| `subordinate_ids` | One2many → `dayflow.employee` | — |
| `tenure_display` | Char | computed |
| `user_id` | Many2one → `res.users` | — |
| `work_email` | Char | — |
| `work_location` | Selection | values: `office`, `remote`, `hybrid` |
| `zip` | Char | — |

### `dayflow.attendance`

| Field | Type | Notes |
| --- | --- | --- |
| `check_in` | Datetime | required |
| `check_in_date` | Date | computed |
| `check_out` | Datetime | — |
| `day_name` | Selection | computed · values: `0`, `1`, `2`, `3`, `4`, `5`, `6` |
| `department_id` | Many2one → `dayflow.department` | related `employee_id.department_id` |
| `display_label` | Char | computed |
| `employee_id` | Many2one → `dayflow.employee` | required |
| `is_late` | Boolean | computed |
| `leave_id` | Many2one → `dayflow.leave` | — |
| `note` | Char | — |
| `overtime_hours` | Float | computed |
| `status` | Selection | required · values: `present`, `half_day`, `absent`, `leave` |
| `status_manual` | Boolean | — |
| `week_label` | Char | computed |
| `worked_hours` | Float | computed |

### `dayflow.leave`

| Field | Type | Notes |
| --- | --- | --- |
| `approval_comment` | Text | — |
| `approver_id` | Many2one → `res.users` | — |
| `attachment_ids` | Many2many → `ir.attachment` | — |
| `attendance_ids` | One2many → `dayflow.attendance` | — |
| `can_approve` | Boolean | computed |
| `can_edit` | Boolean | computed |
| `date_from` | Date | required |
| `date_to` | Date | required |
| `decision_date` | Datetime | — |
| `department_id` | Many2one → `dayflow.department` | related `employee_id.department_id` |
| `duration_days` | Float | computed |
| `employee_id` | Many2one → `dayflow.employee` | required |
| `half_day_period` | Selection | values: `morning`, `afternoon` |
| `is_half_day` | Boolean | — |
| `leave_category` | Selection | related `leave_type_id.category` |
| `leave_type_id` | Many2one → `dayflow.leave.type` | required |
| `name` | Char | required |
| `remaining_balance` | Float | computed |
| `remarks` | Text | — |
| `state` | Selection | required · values: `draft`, `to_approve`, `approved`, `rejected`, `cancelled` |

### `dayflow.leave.type`

| Field | Type | Notes |
| --- | --- | --- |
| `active` | Boolean | — |
| `allocated_days` | Float | — |
| `allow_negative_balance` | Boolean | — |
| `category` | Selection | required · values: `paid`, `sick`, `unpaid` |
| `code` | Char | required |
| `color` | Integer | — |
| `description` | Text | — |
| `is_paid` | Boolean | computed |
| `max_consecutive_days` | Float | — |
| `min_notice_days` | Integer | — |
| `name` | Char | required |
| `requires_approval` | Boolean | — |
| `sequence` | Integer | — |

### `dayflow.payslip`

| Field | Type | Notes |
| --- | --- | --- |
| `basic_salary` | Monetary | — |
| `currency_id` | Many2one → `res.currency` | related `company_id.currency_id` |
| `date_from` | Date | required |
| `date_to` | Date | required |
| `deduction_line_ids` | One2many → `dayflow.payslip.line` | — |
| `department_id` | Many2one → `dayflow.department` | related `employee_id.department_id` |
| `earning_line_ids` | One2many → `dayflow.payslip.line` | — |
| `employee_id` | Many2one → `dayflow.employee` | required |
| `gross_salary` | Monetary | — |
| `lop_amount` | Monetary | — |
| `lop_days` | Float | — |
| `name` | Char | required |
| `net_salary` | Monetary | — |
| `note` | Text | — |
| `payable_days` | Float | — |
| `payment_date` | Date | — |
| `period_label` | Char | computed |
| `state` | Selection | required · values: `draft`, `computed`, `confirmed`, `paid`, `cancelled` |
| `structure_id` | Many2one → `dayflow.salary.structure` | — |
| `total_deductions` | Monetary | — |
| `worked_days` | Float | — |

### `dayflow.payslip.line`

| Field | Type | Notes |
| --- | --- | --- |
| `amount` | Monetary | required |
| `code` | Char | required |
| `currency_id` | Many2one → `res.currency` | related `payslip_id.currency_id` |
| `name` | Char | required |
| `sequence` | Integer | — |

### `dayflow.salary.structure`

| Field | Type | Notes |
| --- | --- | --- |
| `active` | Boolean | — |
| `code` | Char | required |
| `company_id` | Many2one → `res.company` | — |
| `currency_id` | Many2one → `res.currency` | related `company_id.currency_id` |
| `employee_count` | Integer | computed |
| `employee_ids` | One2many → `dayflow.employee` | — |
| `line_ids` | One2many → `dayflow.salary.line` | — |
| `name` | Char | required |
| `note` | Text | — |
| `sequence` | Integer | — |

### `dayflow.salary.line`

| Field | Type | Notes |
| --- | --- | --- |
| `amount` | Float | required |
| `amount_type` | Selection | required · values: `fixed`, `percentage` |
| `base` | Selection | values: `basic`, `gross` |
| `code` | Char | required |
| `name` | Char | required |
| `note` | Char | — |
| `rule_type` | Selection | required · values: `earning`, `deduction` |
| `sequence` | Integer | — |

### `dayflow.department`

| Field | Type | Notes |
| --- | --- | --- |
| `active` | Boolean | — |
| `code` | Char | — |
| `color` | Integer | — |
| `employee_count` | Integer | computed |
| `employee_ids` | One2many → `dayflow.employee` | — |
| `manager_id` | Many2one → `dayflow.employee` | — |
| `name` | Char | required |
| `note` | Html | — |
| `parent_id` | Many2one → `dayflow.department` | — |

### `dayflow.document`

| Field | Type | Notes |
| --- | --- | --- |
| `attachment` | Binary | required |
| `attachment_name` | Char | — |
| `doc_type` | Selection | required · values: `id_proof`, `address_proof`, `contract`, `education`, `experience`, `payslip`, `other` |
| `employee_id` | Many2one → `dayflow.employee` | required |
| `expiry_date` | Date | — |
| `issue_date` | Date | — |
| `name` | Char | required |
| `note` | Text | — |
| `state` | Selection | computed · values: `valid`, `expiring`, `expired` |

### `res.users`

| Field | Type | Notes |
| --- | --- | --- |
| `dayflow_email_verified` | Boolean | — |
| `dayflow_employee_code` | Char | — |
| `dayflow_employee_id` | Many2one → `dayflow.employee` | computed |
| `dayflow_role` | Selection | values: `employee`, `hr` |
| `dayflow_self_signup` | Boolean | — |

<!-- END GENERATED -->

---

## 5. Regenerating section 4

After changing any view, re-run the extractor so this document stays true:

```bash
node tools/extract_contract.js dayflow_hrms
```
