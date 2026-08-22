r"""End-to-end smoke test for the merged Dayflow backend.

Exercises both halves through the seam: register -> login -> JWT -> apply leave
-> HR approves -> notification lands -> payroll -> reports.

    DATABASE_URL="sqlite+aiosqlite:///./_e2e.db" SECRET_KEY=test \
        uvicorn app.main:app --port 8923      # terminal 1
    python tests/e2e_smoke.py                 # terminal 2

Standard library only.
"""

import json, sqlite3, urllib.request, urllib.error, datetime
B = "http://127.0.0.1:8923"
def call(method, path, token=None, body=None, form=None):
    req = urllib.request.Request(B+path, method=method)
    data = None
    if token: req.add_header("Authorization", f"Bearer {token}")
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        req.add_header("Content-Type","application/x-www-form-urlencoded")
    elif body is not None:
        data = json.dumps(body).encode(); req.add_header("Content-Type","application/json")
    try:
        with urllib.request.urlopen(req, data) as r: return r.status, r.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.read().decode()

res=[]
def ck(name, want, got):
    code, body = got; ok = code==want; res.append(ok)
    print(f"  {'ok  ' if ok else 'FAIL'} {name:<46} {code}" + ("" if ok else f"  want {want}  {body[:110]}"))
    return body

import urllib.parse
# 1. register two accounts
ck("register employee", 201, call("POST","/api/v1/auth/register", body={
  "employee_id":"DF-EMP-1002","email":"arjun@dayflow.com","password":"Passw0rd!23",
  "first_name":"Arjun","last_name":"Nair","job_title":"Backend Engineer","department":"Engineering"}))
ck("register HR", 201, call("POST","/api/v1/auth/register", body={
  "employee_id":"DF-HR-0001","email":"priya@dayflow.com","password":"Passw0rd!23",
  "first_name":"Priya","last_name":"Menon","job_title":"HR Lead","department":"People"}))
ck("register duplicate email rejected", 400, call("POST","/api/v1/auth/register", body={
  "employee_id":"DF-EMP-9999","email":"arjun@dayflow.com","password":"Passw0rd!23",
  "first_name":"Dupe","last_name":"User"}))

# 2. activate + promote directly in the DB (email verification / admin action)
db = sqlite3.connect("_e2e.db")
db.execute("UPDATE employees SET is_active=1")
db.execute("UPDATE employees SET role='HR' WHERE email='priya@dayflow.com'")
db.commit()
ids = dict(db.execute("SELECT email, id FROM employees").fetchall()); db.close()
print(f"  -- activated; ids={ids}")

# 3. login
body = ck("employee login", 200, call("POST","/api/v1/auth/login", form={"username":"arjun@dayflow.com","password":"Passw0rd!23"}))
emp_tok = json.loads(body)["access_token"]
body = ck("HR login", 200, call("POST","/api/v1/auth/login", form={"username":"priya@dayflow.com","password":"Passw0rd!23"}))
hr_tok = json.loads(body)["access_token"]
ck("wrong password rejected", 401, call("POST","/api/v1/auth/login", form={"username":"arjun@dayflow.com","password":"nope"}))
ck("no token -> 401", 401, call("GET","/api/leaves/my"))
ck("garbage token -> 401", 401, call("GET","/api/leaves/my", token="not-a-jwt"))

# 4. leave flow across the seam
today = datetime.date.today()
d1, d2 = today+datetime.timedelta(days=10), today+datetime.timedelta(days=12)
body = ck("employee applies for leave", 201, call("POST","/api/leaves", token=emp_tok,
    body={"leave_type":"CASUAL","start_date":str(d1),"end_date":str(d2),"remarks":"Family function"}))
leave_id = json.loads(body)["leave"]["id"]
ck("overlap rejected", 409, call("POST","/api/leaves", token=emp_tok,
    body={"leave_type":"SICK","start_date":str(d1),"end_date":str(d2)}))
ck("employee CANNOT list all leaves", 403, call("GET","/api/leaves", token=emp_tok))
ck("employee CANNOT approve", 403, call("PUT",f"/api/leaves/{leave_id}/approve", token=emp_tok, body={}))
ck("HR lists all leaves", 200, call("GET","/api/leaves", token=hr_tok))
ck("HR approves", 200, call("PUT",f"/api/leaves/{leave_id}/approve", token=hr_tok, body={"admin_comment":"Approved"}))
ck("double approve -> 409", 409, call("PUT",f"/api/leaves/{leave_id}/approve", token=hr_tok, body={}))

# 5. notifications — proves the cross-module transaction worked
body = ck("employee sees approval notification", 200, call("GET","/api/notifications", token=emp_tok))
n = json.loads(body)
print(f"  -- notifications for employee: total={n['total']} unread={n['unread']}")
res.append(n["total"] >= 1)
print(f"  {'ok  ' if n['total']>=1 else 'FAIL'} notification actually created by approval")
body = ck("HR was notified of the new request", 200, call("GET","/api/notifications", token=hr_tok))
hrn = json.loads(body)
print(f"  -- HR notifications: total={hrn['total']}  (was always 0 before the merge)")
res.append(hrn["total"] >= 1)
print(f"  {'ok  ' if hrn['total']>=1 else 'FAIL'} HR notified on submission (previously a stub)")

# 6. payroll
ck("employee CANNOT set own salary", 403, call("PUT",f"/api/payroll/{ids['arjun@dayflow.com']}", token=emp_tok,
    body={"basic_salary":"999999","allowances":"0","deductions":"0","month":8,"year":2026}))
ck("HR creates payroll", 201, call("PUT",f"/api/payroll/{ids['arjun@dayflow.com']}", token=hr_tok,
    body={"basic_salary":"50000.00","allowances":"5000.00","deductions":"2000.00","month":8,"year":2026}))
ck("HR updates same period", 200, call("PUT",f"/api/payroll/{ids['arjun@dayflow.com']}", token=hr_tok,
    body={"basic_salary":"52000.00","allowances":"5000.00","deductions":"2000.00","month":8,"year":2026}))
ck("employee views own payroll", 200, call("GET","/api/payroll/my", token=emp_tok))
ck("payroll FK rejects unknown employee", 409, call("PUT","/api/payroll/99999", token=hr_tok,
    body={"basic_salary":"100","allowances":"0","deductions":"0","month":8,"year":2026}))

# 7. reports — including the one that used to 503
ck("leave report", 200, call("GET","/api/reports/leave", token=hr_tok))
ck("payroll report", 200, call("GET","/api/reports/payroll", token=hr_tok))
body = ck("employee report (real headcount)", 200, call("GET","/api/reports/employees", token=hr_tok))
print(f"  -- {body[:150]}")
body = ck("attendance report (was 503)", 200, call("GET","/api/reports/attendance", token=hr_tok))
print(f"  -- {body[:150]}")
ck("employee blocked from reports", 403, call("GET","/api/reports/leave", token=emp_tok))

print(f"\n  ============ {sum(res)} passed, {len(res)-sum(res)} failed ============")
