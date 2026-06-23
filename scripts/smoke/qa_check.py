# -*- coding: utf-8 -*-
"""
QA-смоук прода Traektoriya: логин + прогон ключевых эндпоинтов API с проверками.
Проверяет БЭКЕНД-API (не UI). Зависимостей нет — только stdlib (urllib).

Запуск локально:
    python scripts/smoke/qa_check.py
Переменные окружения (необязательны):
    SMOKE_API_BASE   (default https://api.traektoriya.space/api/v1)
    SMOKE_USER       (default admin)
    SMOKE_PASSWORD   (default admin123)  ← в CI берётся из GitHub Secret
Код возврата: 0 — все PASS, 1 — есть FAIL (для гейта в CI).
"""
import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get("SMOKE_API_BASE", "https://api.traektoriya.space/api/v1")
USER = os.environ.get("SMOKE_USER", "admin")
PWD = os.environ.get("SMOKE_PASSWORD", "admin123")
PASS, FAIL = [], []


def call(method, path, tok=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if tok:
        req.add_header("Authorization", "Bearer " + tok)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return 0, str(e)


def check(name, ok, detail=""):
    (PASS if ok else FAIL).append(name)
    print(("  PASS " if ok else "  FAIL ") + name + ("  | " + str(detail) if detail else ""))


def arr(d):
    if isinstance(d, list):
        return d
    if isinstance(d, dict):
        for k in ("items", "leaders", "leaderboard", "teams", "results", "data", "members", "events", "programs"):
            if isinstance(d.get(k), list):
                return d[k]
    return []


# --- auth ---
st, d = call("POST", "/auth/login", body={"employee_id": USER, "password": PWD})
tok = d.get("access_token") if isinstance(d, dict) else None
check("auth/login %s" % USER, st == 200 and tok, "http=%s" % st)
if not tok:
    print("НЕТ ТОКЕНА — стоп")
    sys.exit(1)

print("\n[ОБУЧЕНИЕ]")
st, d = call("GET", "/learning/map?role=sales_rep", tok)
check("learning/map", st == 200 and len(d.get("sections", []) if isinstance(d, dict) else []) > 0,
      "secs=%s" % (len(d.get("sections", [])) if isinstance(d, dict) else "?"))
st, d = call("GET", "/learning/leaderboard?period=month&role=sales_rep&limit=5", tok)
check("learning/leaderboard ТП", st == 200 and len(arr(d)) > 0, "n=%s" % len(arr(d)))
st, d = call("GET", "/learning/leaderboard?period=month&role=regional_manager&limit=5", tok)
rms = arr(d)
rm_scored = [x for x in rms if (x.get("score") or x.get("total_score") or x.get("combined_score") or 0)]
check("learning/leaderboard РМ (не нули)", st == 200 and len(rm_scored) > 0, "scored=%s/%s" % (len(rm_scored), len(rms)))

print("\n[ПУЛЬС / КОМПЕТЕНЦИИ]")
st, d = call("GET", "/pulse/subordinates", tok)
n = d.get("members_count") if isinstance(d, dict) else 0
ax = len(d.get("competency_averages", [])) if isinstance(d, dict) else 0
check("pulse/subordinates (admin видит всех)", st == 200 and n and n >= 60, "members=%s" % n)
check("pulse радар = 8 осей (без дублей)", ax == 8, "axes=%s" % ax)
st, lb = call("GET", "/kpi/leaderboard/top?period=2026-06&role=sales_rep&limit=1", tok)
tp_id = arr(lb)[0]["user_id"] if arr(lb) else None
if tp_id:
    st, d = call("GET", "/pulse/user/%s" % tp_id, tok)
    comps = d.get("competencies", []) if isinstance(d, dict) else []
    check("pulse/user ТП (8 компетенций)", st == 200 and len(comps) == 8,
          "comps=%s pulse=%s" % (len(comps), d.get("overall_pulse") if isinstance(d, dict) else "?"))
    st, d = call("GET", "/competency-matrix/user/%s" % tp_id, tok)
    check("competency-matrix ТП", st == 200 and isinstance(d, dict) and d.get("total_competencies") == 8,
          "comps=%s" % (d.get("total_competencies") if isinstance(d, dict) else st))
st, me = call("GET", "/users/me", tok)
admin_uid = me.get("id") if isinstance(me, dict) else None
if admin_uid:
    st, d = call("GET", "/competency-matrix/user/%s" % admin_uid, tok)
    check("competency-matrix АДМИН (был 404)", st == 200, "http=%s" % st)
st, d = call("GET", "/competency-profiles", tok)
check("competency-profiles (профили ролей)", st == 200 and len(arr(d)) >= 3, "n=%s" % len(arr(d)))

print("\n[ЛИДЕРБОРДЫ / KPI]")
for role in ("sales_rep", "supervisor", "regional_manager"):
    st, d = call("GET", "/kpi/leaderboard/top?period=2026-06&role=%s&limit=5" % role, tok)
    leaders = arr(d)
    check("kpi/leaderboard %s" % role, st == 200 and len(leaders) > 0, "n=%s" % len(leaders))
st, d = call("GET", "/kpi/team-rating/all?period=2026-06", tok)
check("kpi/team-rating", st == 200 and len(arr(d)) >= 1, "teams=%s" % len(arr(d)))

print("\n[ПЛАН ОБУЧЕНИЯ]")
st, d = call("GET", "/training-plan/calendar", tok)
ev = arr(d)
bad_pct = [e for e in ev if (e.get("pre_avg_score") or 0) > 1.5]
check("training-plan/calendar", st == 200 and len(ev) > 0, "n=%s" % len(ev))
check("training % = доли 0..1 (не >100%)", len(bad_pct) == 0, "вне диапазона: %s" % len(bad_pct))
st, d = call("GET", "/training-plan/field-trips", tok)
check("training-plan/field-trips", st == 200, "n=%s" % len(arr(d)))

print("\n[ОСТАЛЬНЫЕ РАЗДЕЛЫ]")
for nm, path, mn in (
    ("offline/programs", "/offline/programs", 1),
    ("tasks", "/tasks?limit=10", 1),
    ("products", "/products?limit=10", 1),
    ("teams", "/teams", 1),
):
    st, d = call("GET", path, tok)
    check(nm, st == 200 and len(arr(d)) >= mn, "n=%s" % len(arr(d)))
for nm, path in (("power/my", "/power/my"), ("analytics/overview", "/analytics/overview"), ("dashboard/widgets", "/dashboard/widgets")):
    st, d = call("GET", path, tok)
    check(nm, st == 200, "http=%s" % st)

print("\n==================== ИТОГ ====================")
print("PASS: %d   FAIL: %d" % (len(PASS), len(FAIL)))
if FAIL:
    print("ПРОВАЛЫ:", ", ".join(FAIL))
sys.exit(1 if FAIL else 0)
