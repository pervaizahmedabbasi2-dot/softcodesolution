#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SCS_BASE_URL:-http://127.0.0.1:8080}"
API_KEY="${SCS_TEST_API_KEY:-}"

echo "============================================================"
echo "CARD 03 — PHASE 2F"
echo "API GATEWAY RUNTIME ACCEPTANCE"
echo "============================================================"

echo
echo "[1] Health"
curl -fsS "${BASE_URL}/healthz" >/dev/null
echo "✅ healthz"

echo
echo "[2] Readiness"
curl -fsS "${BASE_URL}/readyz" >/dev/null
echo "✅ readyz"

echo
echo "[3] API-key security boundary without credential"
STATUS="$(curl -sS -o /tmp/scs-gateway-unauth.json -w '%{http_code}' \
  "${BASE_URL}/api/gateway/security/probe")"

if [ "${STATUS}" != "401" ]; then
  echo "❌ Expected 401, got ${STATUS}"
  cat /tmp/scs-gateway-unauth.json || true
  exit 1
fi

echo "✅ missing API key → 401"

if [ -z "${API_KEY}" ]; then
  echo
  echo "⏳ VALID-KEY TESTS SKIPPED"
  echo "Set SCS_TEST_API_KEY to an actual active test key."
  echo
  echo "============================================================"
  echo "RESULT: PARTIAL — SECURITY BOUNDARY VERIFIED"
  echo "============================================================"
  exit 0
fi

echo
echo "[4] Valid API key"
STATUS="$(curl -sS -o /tmp/scs-gateway-valid.json -w '%{http_code}' \
  -H "X-SCS-API-Key: ${API_KEY}" \
  "${BASE_URL}/api/gateway/security/probe")"

if [ "${STATUS}" != "200" ]; then
  echo "❌ Valid API key expected 200, got ${STATUS}"
  cat /tmp/scs-gateway-valid.json
  exit 1
fi

echo "✅ valid API key → 200"

echo
echo "[5] Scope/security boundary"
STATUS="$(curl -sS -o /tmp/scs-gateway-superadmin.json -w '%{http_code}' \
  -H "X-SCS-API-Key: ${API_KEY}" \
  "${BASE_URL}/api/superadmin/clients")"

if [ "${STATUS}" = "200" ]; then
  echo "❌ API key crossed SuperAdmin session boundary"
  exit 1
fi

echo "✅ SuperAdmin session boundary protected"

echo
echo "============================================================"
echo "RESULT: PASS"
echo "============================================================"
