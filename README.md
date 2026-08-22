<div align="center">

# 🗓️ Dayflow

### Human Resource Management System

**Every workday, perfectly aligned.**

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0_async-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**27 endpoints** · **7 modules** · **5 tables** · **9 screens** · **5,820 lines** · **29 end-to-end checks**

*A full-stack HRMS: JWT authentication, role-based access, attendance, leave workflows, payroll and analytics.*

</div>

---

## 📖 Table of Contents

- [The Problem](#-the-problem)
- [Features by Role](#-features-by-role)
- [Architecture](#-architecture)
- [Request Lifecycle](#-request-lifecycle)
- [Data Model](#-data-model)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Security Model](#-security-model)
- [Business Rules](#-business-rules)
- [Engineering Decisions](#-engineering-decisions)
- [Testing](#-testing)
- [Design System](#-design-system)
- [Roadmap](#-roadmap)
- [Team](#-team)

---

## 🎯 The Problem

HR work in small organisations is scattered across spreadsheets, email threads
and paper forms. Leave requests get lost in inboxes. Attendance lives in one
file, salary in another, and nobody can answer *"how many people are off next
Tuesday?"* without opening four documents.

**Dayflow centralises it.** One system, three roles, one source of truth —
where applying for leave notifies HR automatically, approving it notifies the
employee in the same transaction, and every figure on the dashboard is computed
by the database rather than copied by hand.

---

## ✨ Features by Role

<table>
<tr><th align="left">👤 Employee</th><th align="left">🧑‍💼 HR</th><th align="left">🛡️ Admin</th></tr>
<tr valign="top">
<td>

- Register & sign in
- View profile & job details
- Check in / check out
- Daily & weekly attendance
- Apply for leave
- Track request status
- View payslips *(read-only)*
- Notification feed

</td>
<td>

- Everything an employee can do
- Employee directory
- View anyone's attendance
- Approve / reject leave
- Add decision comments
- Create & update payroll
- All four analytics reports

</td>
<td>

- Everything HR can do
- Edit any employee record
- **Grant and revoke roles**

</td>
</tr>
</table>

---

## 🏗 Architecture

```mermaid
flowchart LR
    subgraph client["🖥️ Client"]
        UI["React 19 + Tailwind v4<br/><i>Vite dev server</i>"]
    end

    subgraph api["⚡ FastAPI — fully async"]
        direction TB
        AUTH["🔐 Auth · 👤 Employees · 🕐 Attendance"]
        SEAM["app/dependencies.py<br/><b>the seam</b>"]
        MODS["🏖️ Leave · 💰 Payroll · 🔔 Notifications · 📊 Reports"]
        AUTH -.->|"get_current_user<br/>require_hr_admin"| SEAM
        SEAM --> MODS
    end

    DB[("🐘 PostgreSQL<br/>5 tables · 1 metadata")]

    UI -->|"JWT Bearer"| AUTH
    UI -->|"JWT Bearer"| MODS
    AUTH --> DB
    MODS --> DB

    style UI fill:#61DAFB,stroke:#0891b2,color:#000
    style AUTH fill:#009688,stroke:#00695c,color:#fff
    style MODS fill:#635BFF,stroke:#4f46e5,color:#fff
    style SEAM fill:#f59e0b,stroke:#b45309,color:#000
    style DB fill:#4169E1,stroke:#1e3a8a,color:#fff
```

The backend was built by two developers in parallel. **`app/dependencies.py` is
the only seam between the halves** — the four business modules import
`get_current_user`, `require_hr_admin`, `CurrentUser` and `is_hr_or_admin` from
that one file and nothing else. If the auth implementation is ever replaced,
exactly one file changes.

### Layer contract

Every request travels through the same five files:

```
routes.py  →  controller.py  →  service.py  →  model.py  →  PostgreSQL
                    ↑
                schema.py  (Pydantic validation)
```

| Layer | Knows HTTP? | Knows SQL? | Holds business rules? |
|:--|:-:|:-:|:-:|
| `routes.py` | ✅ | ❌ | ❌ |
| `controller.py` | ✅ | ❌ | ❌ |
| `service.py` | ❌ | ✅ | ✅ |
| `model.py` | ❌ | ✅ | ❌ |
| `schema.py` | ❌ | ❌ | shape only |

Services raise plain Python errors — `NotFoundError`, `ConflictError`,
`ForbiddenError`. A **single handler** in `main.py` maps them to status codes,
which is why no controller in the codebase contains a `try/except` block.

---

## 🔄 Request Lifecycle

Leave approval — the path that crosses both halves of the backend and two
modules, in one transaction:

```mermaid
sequenceDiagram
    autonumber
    participant HR as 🧑‍💼 HR
    participant RT as routes.py
    participant AU as core/dependencies.py
    participant SV as leave/service.py
    participant NS as notifications/service.py
    participant DB as 🐘 PostgreSQL

    HR->>RT: PUT /api/leaves/41/approve<br/>Authorization: Bearer …
    RT->>AU: require_hr_admin
    AU->>DB: decode JWT → SELECT employee
    AU-->>RT: Employee(role=hr) ✔
    RT->>SV: approve_leave(41, reviewer)
    SV->>DB: SELECT leave WHERE id = 41
    Note over SV: status must be PENDING<br/>reviewer ≠ applicant
    SV->>NS: create_notification(commit=False)
    NS->>DB: INSERT notification
    SV->>DB: COMMIT — leave + notification together
    SV-->>HR: 200 { message, leave }
```

Step 9 is the point of the design. The notification service is called with
`commit=False`, so the leave update and the notification it raises share **one
transaction**. Either both land or neither does — there is no state where a
leave is approved but the employee was never told.

---

## 🗃 Data Model

```mermaid
erDiagram
    EMPLOYEES ||--o{ ATTENDANCES : records
    EMPLOYEES ||--o{ LEAVE_REQUESTS : applies
    EMPLOYEES ||--o{ PAYROLL : "is paid via"
    EMPLOYEES ||--o{ NOTIFICATIONS : receives

    EMPLOYEES {
        int id PK "integer surrogate key"
        string employee_id UK "DF-EMP-1002"
        string email UK
        string hashed_password
        enum role "admin · hr · employee"
        bool is_active "false until verified"
        string first_name
        string last_name
        string department
    }
    ATTENDANCES {
        int id PK
        int employee_id FK
        date record_date
        datetime check_in
        datetime check_out
        enum status "present · absent · half-day · leave"
    }
    LEAVE_REQUESTS {
        int id PK
        int employee_id FK
        enum leave_type "SICK · CASUAL · ANNUAL · UNPAID"
        date start_date
        date end_date
        enum status "PENDING · APPROVED · REJECTED"
        string admin_comment
        int reviewed_by FK
    }
    PAYROLL {
        int id PK
        int employee_id FK
        decimal basic_salary
        decimal allowances
        decimal deductions
        decimal net_salary "computed server-side"
        int month
        int year
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        string message
        enum type
        bool is_read
    }
```

**Two constraints worth pointing at:**

`PAYROLL` carries `UNIQUE(employee_id, month, year)` — one payslip per person
per period, enforced by the database rather than by hope. And all four foreign
keys resolve to `employees.id`, so a payroll row can never reference an
employee who does not exist.

> ⚠️ **Identity gotcha.** `employees.id` is the integer primary key and is what
> every foreign key references. `employees.employee_id` is a human-readable
> **string** code like `"DF-EMP-1002"`. They are not interchangeable — confusing
> them silently corrupts relationships.

---

## 🛠 Tech Stack

| Layer | Choice | Why |
|:--|:--|:--|
| **API** | FastAPI | Async-native, OpenAPI docs for free, Pydantic built in |
| **ORM** | SQLAlchemy 2.0 (async) | One `AsyncEngine`, typed `Mapped[]` columns |
| **Database** | PostgreSQL 14+ / asyncpg | Real constraint enforcement, proper `DECIMAL` |
| **Validation** | Pydantic v2 | Request/response contracts, not hand-written checks |
| **Auth** | PyJWT + passlib/bcrypt | Standard bearer tokens, salted password hashes |
| **Frontend** | React 19 + Vite 6 | Fast HMR, modern component model |
| **Styling** | Tailwind CSS v4 | Design tokens in `@theme`, zero runtime CSS |
| **Icons** | lucide-react | Consistent, tree-shakeable |

---

## 📁 Project Structure

```
Dayflow/
├── app/                          # ── FastAPI backend
│   ├── main.py                   # app factory, CORS, exception handlers, routers
│   ├── dependencies.py           # 🔗 THE SEAM between the two halves
│   ├── exceptions.py             # service errors → HTTP status codes
│   │
│   ├── core/                     # ── Person 1
│   │   ├── config.py             # pydantic-settings, reads .env
│   │   ├── security.py           # bcrypt hashing, JWT encode/decode
│   │   ├── dependencies.py       # get_current_user, RoleChecker
│   │   └── time_utils.py         # business timezone (Asia/Kolkata)
│   ├── db/
│   │   ├── database.py           # AsyncEngine, AsyncSession, Base
│   │   └── base.py               # model registry for create_all
│   ├── models/                   # Employee, Attendance
│   ├── schemas/                  # auth, employee, attendance
│   ├── crud/                     # data access for the auth half
│   ├── api/v1/                   # auth · employees · attendance routers
│   │
│   └── modules/                  # ── Person 2 · one shape, four times
│       ├── leave/                # routes · controller · service · model · schema
│       ├── payroll/
│       ├── notifications/
│       └── reports/              # no tables of its own — aggregation only
│
├── frontend/                     # ── React client
│   └── src/
│       ├── App.jsx               # auth gate + role-based routing
│       ├── layout/               # AppShell · Sidebar · Topbar
│       ├── components/ui/        # Card · Badge · Button · Avatar · Field
│       │                         # Modal · Table · StatTile · EmptyState
│       ├── components/dashboard/ # TodayCard · WeekStrip · LeaveSummary · …
│       ├── pages/
│       │   ├── auth/             # SignIn · SignUp · AuthLayout
│       │   ├── EmployeeDashboard.jsx
│       │   ├── HRDashboard.jsx
│       │   ├── Leave.jsx         # apply + approve/reject
│       │   ├── Attendance.jsx    # check-in/out, week + list views
│       │   ├── Profile.jsx       # view + edit states
│       │   ├── Payroll.jsx       # read-only / HR table + editor
│       │   └── Reports.jsx
│       ├── data/store.js         # demo store with real mutation logic
│       ├── lib/                  # status vocabulary, formatters
│       └── index.css             # design tokens (@theme)
│
├── tests/e2e_smoke.py            # 29 end-to-end checks, stdlib only
├── docs/FRONTEND_CONTRACT.md     # the API shapes the UI binds to
└── requirements.txt
```

Every backend module is **identical in shape**. Learn one, and you know all four.

---

## 🚀 Getting Started

### Prerequisites

`Python 3.13+` · `PostgreSQL 14+` · `Node 20+`

### 1 · Backend

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create the database — this is **SQL, run inside PostgreSQL**, not in your shell:

```sql
CREATE DATABASE dayflow_db;
```

Configure `.env` in the project root:

```ini
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/dayflow_db"
SECRET_KEY="a-long-random-string-you-generate"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
TIMEZONE="Asia/Kolkata"
```

> `.env` is git-ignored. No credential appears in any `.py` file.

```bash
uvicorn app.main:app --reload
```

Tables are created automatically at startup.

| | |
|:--|:--|
| 📘 **Swagger UI** | http://127.0.0.1:8000/docs |
| 📗 **ReDoc** | http://127.0.0.1:8000/redoc |
| ❤️ **Health** | http://127.0.0.1:8000/health |

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173
```

### 3 · First run, end to end

```bash
# register
curl -X POST localhost:8000/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"employee_id":"DF-EMP-1002","email":"arjun@dayflow.com","password":"Passw0rd!23",
       "first_name":"Arjun","last_name":"Nair","department":"Engineering"}'

# log in (OAuth2 password flow — form-encoded, not JSON)
curl -X POST localhost:8000/api/v1/auth/login \
  -d 'username=arjun@dayflow.com&password=Passw0rd!23'

# use the token
curl localhost:8000/api/leaves/my -H "Authorization: Bearer <token>"
```

> New accounts start `is_active = false` pending email verification, and
> `/register` deliberately **does not accept a role** — otherwise anyone could
> sign up as an admin. Roles are granted through the admin-only employee endpoint.

---

## 🔌 API Reference

<details open>
<summary><b>🔐 Authentication</b> — 3 endpoints</summary>

| Method | Endpoint | Access | Description |
|:--|:--|:--|:--|
| `POST` | `/api/v1/auth/register` | Public | Create an account |
| `POST` | `/api/v1/auth/login` | Public | OAuth2 password flow → JWT |
| `GET` | `/api/v1/auth/me` | Any | Current user profile |

</details>

<details open>
<summary><b>👤 Employees · 🕐 Attendance</b> — 5 endpoints</summary>

| Method | Endpoint | Access | Description |
|:--|:--|:--|:--|
| `GET` | `/api/v1/employees` | HR · Admin | Employee directory |
| `PATCH` | `/api/v1/employees/{employee_pk}` | Admin | Edit details, grant roles |
| `POST` | `/api/v1/attendance/check-in` | Any | Start the working day |
| `POST` | `/api/v1/attendance/check-out` | Any | Close it |
| `GET` | `/api/v1/attendance/history` | Owner · HR · Admin | Daily / weekly records |

</details>

<details open>
<summary><b>🏖️ Leave</b> — 6 endpoints</summary>

| Method | Endpoint | Access | Description |
|:--|:--|:--|:--|
| `POST` | `/api/leaves` | Any | Apply → `PENDING` |
| `GET` | `/api/leaves/my` | Any | Your own requests |
| `GET` | `/api/leaves` | HR · Admin | All requests, filterable |
| `GET` | `/api/leaves/{leave_id}` | Owner · HR · Admin | One request |
| `PUT` | `/api/leaves/{leave_id}/approve` | HR · Admin | Approve a pending request |
| `PUT` | `/api/leaves/{leave_id}/reject` | HR · Admin | Reject — reason required |

</details>

<details open>
<summary><b>💰 Payroll · 🔔 Notifications</b> — 7 endpoints</summary>

| Method | Endpoint | Access | Description |
|:--|:--|:--|:--|
| `GET` | `/api/payroll/my` | Any | Your own payslips |
| `GET` | `/api/payroll` | HR · Admin | All payroll records |
| `GET` | `/api/payroll/{employee_id}` | Owner · HR · Admin | One employee's history |
| `PUT` | `/api/payroll/{employee_id}` | HR · Admin | Create or update a period |
| `GET` | `/api/notifications` | Any | Your notifications |
| `GET` | `/api/notifications/unread-count` | Any | Badge counter |
| `PUT` | `/api/notifications/{notification_id}/read` | Owner | Mark as read |

</details>

<details open>
<summary><b>📊 Reports</b> — 4 endpoints · HR · Admin only</summary>

| Method | Endpoint | Description |
|:--|:--|:--|
| `GET` | `/api/reports/leave` | Status counts, by type, approval rate, days taken |
| `GET` | `/api/reports/payroll` | Totals, average, spread, per-period breakdown |
| `GET` | `/api/reports/employees` | Headcount, active/inactive, department split |
| `GET` | `/api/reports/attendance` | Present / absent / half-day / leave, attendance rate |

</details>

### Status codes

| Code | Meaning |
|:--|:--|
| `200` · `201` | Success · Created |
| `400` | Business rule violated (bad dates, deductions exceed pay) |
| `401` | Missing, malformed or expired token |
| `403` | Authenticated, but not permitted |
| `404` | Not found — *also returned instead of 403 where existence itself is private* |
| `409` | Conflict (overlapping leave, already decided, duplicate period, broken FK) |
| `422` | Payload failed schema validation |

---

## 🔐 Security Model

Authorisation is enforced **server-side at two layers** — the route guard and
again inside the service. Hiding a button in the frontend is not access control.

| Action | Employee | HR | Admin |
|:--|:-:|:-:|:-:|
| Apply for leave | ✅ | ✅ | ✅ |
| View own leave / payroll / attendance | ✅ | ✅ | ✅ |
| View **anyone's** records | ❌ | ✅ | ✅ |
| Approve · reject leave | ❌ | ✅ | ✅ |
| Approve **own** leave | ❌ | ❌ | ❌ |
| Create / update payroll | ❌ | ✅ | ✅ |
| Update **own** payroll | ❌ | ❌ | ❌ |
| View reports | ❌ | ✅ | ✅ |
| Grant roles | ❌ | ❌ | ✅ |

**Additional protections**

- Passwords hashed with **bcrypt**, never stored or logged in plain text
- `/register` does not accept a `role` field — no self-promotion to admin
- Accounts inactive until verified
- **Identity comes from the token, never the request body.** `LeaveCreate` has
  no `employee_id` and no `status` field, so a malicious
  `{"employee_id": 99, "status": "APPROVED"}` is discarded by Pydantic — you
  cannot file leave as someone else, or pre-approve your own
- Cross-user reads return `404`, not `403`, so the API never confirms that
  another user's record exists

---

## 📐 Business Rules

<details open>
<summary><b>Leave</b></summary>

- `start_date` ≤ `end_date`, no start date in the past, maximum **90** consecutive days
- **No overlap** with existing `PENDING` or `APPROVED` requests — a `REJECTED`
  request never blocks re-application
- Adjacent ranges are allowed (Sep 1–3 then Sep 4–5 ✅)
- Only `PENDING` requests can be decided; double-approval → `409`
- Rejection **requires** a written reason
- Nobody may approve their own request
- `total_days` is inclusive: Sep 1 → Sep 3 = **3 days**

</details>

<details open>
<summary><b>Payroll</b></summary>

```
net_salary = basic_salary + allowances − deductions
```

- Computed **server-side** and stored, so a historic payslip never drifts
- `net_salary` is never accepted from the client
- Negative results rejected
- All money stored as `DECIMAL(12,2)` — never floating point
- One record per employee per month, enforced by a unique constraint

</details>

---

## 🧠 Engineering Decisions

The reasoning behind choices that are not obvious from reading the code.

| Decision | Rationale |
|:--|:--|
| **One `AsyncEngine`, one `Base`** | Two engines meant two connection pools and two transactions — a leave could commit while its notification rolled back. Unified so both halves share a session per request. |
| **`DECIMAL`, not `FLOAT`** | `0.1 + 0.2 ≠ 0.3`. Unacceptable for salaries. |
| **Errors raised, not returned** | Services stay HTTP-agnostic; one handler maps them centrally, so no controller needs a `try/except`. |
| **`commit=False` fan-out** | Cross-module writes share a transaction — no orphaned notifications. |
| **Retry on `IntegrityError`** | Check-then-insert is not atomic. Concurrent payroll writes to the same period resolve to an update instead of a `500`. |
| **404 over 403 for other users' rows** | Confirming a record exists is itself an information leak. |
| **Static routes before dynamic** | `/api/leaves/my` must precede `/api/leaves/{id}`, or `"my"` gets parsed as an ID. |
| **Reports own no tables** | Duplicated data drifts. Reports read and aggregate only. |
| **Dialect-aware date maths** | Inclusive day counts use native date subtraction on PostgreSQL, `julianday()` on SQLite, `DATEDIFF()` on MySQL. |
| **Indexed `status` + `employee_id`** | The two hottest filters in the product. |
| **Design tokens in `@theme`** | Components reference `bg-brand-600`, never a hex value — a rebrand is a one-file change. |

---

## 🧪 Testing

`tests/e2e_smoke.py` drives the **real HTTP API** through both halves of the
backend — register → login → JWT → apply leave → HR approves → notification
lands → payroll → reports. Standard library only, nothing to install.

```bash
uvicorn app.main:app --reload          # terminal 1
python tests/e2e_smoke.py              # terminal 2
```

**Result: 29 checks — 28 pass on SQLite, 29 on PostgreSQL.**

<details>
<summary>What's covered</summary>

**Authentication** — registration, duplicate email rejected, login, wrong
password rejected, missing token → 401, malformed token → 401

**Authorisation** — employee blocked from setting their own salary, from
HR-only listings, from other users' leave/payroll/notifications, from every
report; HR blocked from editing their own payroll; employee blocked from
approving their own leave

**Business rules** — overlapping leave → 409, double-approval → 409,
rejection without a reason → 400, payroll upsert creates then updates

**Integration** — approval writes a notification the employee can read; HR is
notified on submission; reports aggregate across all five tables

</details>

> **The one SQLite difference.** SQLite ignores foreign keys unless
> `PRAGMA foreign_keys=ON` is set, so the "reject unknown employee" check
> returns `201` there instead of `409`. Verified with the pragma enabled:
> `FOREIGN KEY constraint failed` — the constraint is real, and PostgreSQL
> enforces it natively.

---

## 🎨 Design System

The frontend is built on tokens, not ad-hoc values. Everything lives in
`frontend/src/index.css` under `@theme`.

| Token | Role |
|:--|:--|
| `brand-600` | Primary actions |
| `canvas` / `surface` | Page background / card background |
| `hairline` | Every border in the app |
| `shadow-card` · `lift` · `pop` | Resting · hover · floating elevation |

Status colours are defined **once** in `lib/status.js`, so "Present" can never
be emerald in one component and green-500 in another.

**Verified responsive** at 1512px and 375px — no horizontal overflow, sidebar
collapses to a drawer, cards reflow, zero console errors.

### Screens

| Screen | Roles | Notes |
|:--|:--|:--|
| Sign In / Sign Up | Public | Per-field errors, live password-strength meter |
| Employee Dashboard | Employee | Greeting, check-in/out, week strip, quick actions |
| HR Dashboard | HR · Admin | KPIs, approvals queue, directory with drill-down |
| Leave | All | Apply modal + HR approve/reject with comments |
| Attendance | All | Check-in/out, week calendar, list view, employee switcher |
| Profile | All | Personal · job · salary · documents; edit phone & address |
| Payroll | All | Read-only for employees; table + editor for HR |
| Reports | HR · Admin | Leave, payroll, attendance and employee analytics |

> **The UI runs on a demo store, not the API yet.** `src/data/store.js` holds
> the data and the mutation logic (overlap checks, net-salary calculation,
> notification fan-out, self-edit blocks), so every flow is genuinely
> interactive — but **state resets on reload**. The shapes match
> `docs/FRONTEND_CONTRACT.md`, so replacing those functions with `fetch` calls
> is the remaining wiring step.

---

## 🗺 Roadmap

| | Milestone |
|:-:|:--|
| ✅ | JWT authentication, roles, employee profiles |
| ✅ | Attendance check-in/out, daily & weekly views |
| ✅ | Leave applications, approvals, comments |
| ✅ | Notifications, transactional with the triggering write |
| ✅ | Payroll with server-side net calculation |
| ✅ | Four analytics reports |
| ✅ | Both backend halves merged — one engine, one metadata |
| ✅ | React app shell + all 9 screens, role-based routing |
| ⬜ | Frontend wired to the live API |
| ⬜ | Alembic migrations (replacing `create_all`) |
| ⬜ | Email verification delivery |

---

## 👥 Team

The backend was split so two developers could work without blocking each other.

| Area | Owner |
|:--|:--|
| 🔐 Authentication · 👤 Employees · 🕐 Attendance | **Person 1** |
| 🏖️ Leave · 💰 Payroll · 🔔 Notifications · 📊 Reports | **Person 2** |
| 🎨 Frontend | Shared |

The two halves met at a single agreed interface — `app/dependencies.py` — which
is why the merge changed one file rather than forty.

---

<div align="center">

**Dayflow** · *Every workday, perfectly aligned.*

Built with FastAPI · async SQLAlchemy · PostgreSQL · React · Tailwind CSS

</div>
