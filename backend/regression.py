"""End-to-end API checks for the Dayflow backend.

Start the server first, then run this in a second terminal:

    uvicorn app.main:app --reload      # terminal 1
    python3 regression.py              # terminal 2

Uses only the standard library - nothing to install.
"""

import datetime, json, urllib.request, urllib.error

B = "http://127.0.0.1:8000"
EMP = {"X-User-Id": "5", "X-Employee-Id": "5", "X-Role": "EMPLOYEE"}
EMP6 = {"X-User-Id": "6", "X-Employee-Id": "6", "X-Role": "EMPLOYEE"}
EMP8 = {"X-User-Id": "8", "X-Employee-Id": "8", "X-Role": "EMPLOYEE"}
HR = {"X-User-Id": "1", "X-Employee-Id": "1", "X-Role": "HR"}
today = datetime.date.today()
d91 = today + datetime.timedelta(days=90)

def call(method, path, headers=None, body=None):
    req = urllib.request.Request(B + path, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

results = []
def ck(name, want, got_tuple):
    code, body = got_tuple
    ok = code == want
    results.append(ok)
    print(f"  {'ok  ' if ok else 'FAIL'} {name:<44} {code}" + ("" if ok else f"  want {want}  {body[:90]}"))

ck("health", 200, call("GET", "/health"))
ck("apply leave", 201, call("POST", "/api/leaves", EMP, {"leave_type":"CASUAL","start_date":"2026-09-01","end_date":"2026-09-03","remarks":"trip"}))
ck("overlap -> 409", 409, call("POST", "/api/leaves", EMP, {"leave_type":"SICK","start_date":"2026-09-02","end_date":"2026-09-04"}))
ck("adjacent dates allowed", 201, call("POST", "/api/leaves", EMP, {"leave_type":"SICK","start_date":"2026-09-04","end_date":"2026-09-05"}))
ck("start today allowed", 201, call("POST", "/api/leaves", EMP6, {"leave_type":"SICK","start_date":str(today),"end_date":str(today)}))
ck("91 days blocked", 400, call("POST", "/api/leaves", EMP8, {"leave_type":"UNPAID","start_date":str(today),"end_date":str(d91)}))
ck("past date blocked", 400, call("POST", "/api/leaves", EMP8, {"leave_type":"SICK","start_date":"2020-01-01","end_date":"2020-01-02"}))
ck("bad leave_type -> 422", 422, call("POST", "/api/leaves", EMP, {"leave_type":"HOLIDAY","start_date":"2027-01-01","end_date":"2027-01-02"}))
ck("no auth -> 401", 401, call("GET", "/api/leaves/my"))
ck("bad role -> 401", 401, call("GET", "/api/leaves/my", {"X-User-Id":"5","X-Role":"MANAGER"}))
ck("employee blocked from all", 403, call("GET", "/api/leaves", EMP))
ck("my leaves", 200, call("GET", "/api/leaves/my", EMP))
ck("filter my leaves by status", 200, call("GET", "/api/leaves/my?status=PENDING", EMP))
ck("HR approves", 200, call("PUT", "/api/leaves/1/approve", HR, {"admin_comment":"ok"}))
ck("double approve -> 409", 409, call("PUT", "/api/leaves/1/approve", HR, {}))
ck("reject without reason -> 400", 400, call("PUT", "/api/leaves/2/reject", HR, {}))
ck("reject with reason", 200, call("PUT", "/api/leaves/2/reject", HR, {"admin_comment":"busy"}))
ck("missing leave -> 404", 404, call("GET", "/api/leaves/99999", HR))
ck("cross-employee leave -> 403", 403, call("GET", "/api/leaves/3", EMP))
ck("notifications list", 200, call("GET", "/api/notifications", EMP))
ck("unread count", 200, call("GET", "/api/notifications/unread-count", EMP))
ck("mark read", 200, call("PUT", "/api/notifications/1/read", EMP))
ck("others notification -> 404", 404, call("PUT", "/api/notifications/1/read", EMP6))
ck("employee sets own salary -> 403", 403, call("PUT", "/api/payroll/5", EMP, {"basic_salary":"9999","allowances":"0","deductions":"0","month":8,"year":2026}))
ck("HR creates payroll -> 201", 201, call("PUT", "/api/payroll/5", HR, {"basic_salary":"50000.00","allowances":"5000.00","deductions":"2000.00","month":8,"year":2026}))
ck("HR updates payroll -> 200", 200, call("PUT", "/api/payroll/5", HR, {"basic_salary":"52000.00","allowances":"5000.00","deductions":"2000.00","month":8,"year":2026}))
ck("HR edits own payroll -> 403", 403, call("PUT", "/api/payroll/1", HR, {"basic_salary":"1","allowances":"0","deductions":"0","month":8,"year":2026}))
ck("deductions too big -> 400", 400, call("PUT", "/api/payroll/9", HR, {"basic_salary":"100","allowances":"0","deductions":"500","month":8,"year":2026}))
ck("negative salary -> 422", 422, call("PUT", "/api/payroll/9", HR, {"basic_salary":"-5","allowances":"0","deductions":"0","month":8,"year":2026}))
ck("month 13 -> 422", 422, call("PUT", "/api/payroll/9", HR, {"basic_salary":"100","allowances":"0","deductions":"0","month":13,"year":2026}))
ck("my payroll", 200, call("GET", "/api/payroll/my", EMP))
ck("cross payroll -> 403", 403, call("GET", "/api/payroll/9", EMP))
ck("HR lists all payroll", 200, call("GET", "/api/payroll", HR))
ck("leave report", 200, call("GET", "/api/reports/leave", HR))
ck("payroll report", 200, call("GET", "/api/reports/payroll", HR))
ck("employee report", 200, call("GET", "/api/reports/employees", HR))
ck("attendance stub -> 503", 503, call("GET", "/api/reports/attendance", HR))
ck("employee blocked from reports", 403, call("GET", "/api/reports/leave", EMP))

print(f"\n  ================ {sum(results)} passed, {len(results)-sum(results)} failed ================")
