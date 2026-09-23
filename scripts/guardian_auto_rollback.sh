#!/bin/bash

# =========================================================
# Guardian Supervisor - Auto Deploy & Rollback
# =========================================================
TELEMETRY_FILE="backend/guardian/data/supervisor-telemetry.json"
mkdir -p "backend/guardian/data"

STABLE_TIME_SECONDS=60
CHECK_INTERVAL=5

log() { echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')] GUARDIAN: $1"; }

get_current_commit() { git rev-parse HEAD 2>/dev/null || echo "unknown"; }

update_telemetry() {
  local status="$1"
  local current="$(get_current_commit)"
  local good="$LAST_KNOWN_GOOD"

  cat > "$TELEMETRY_FILE" <<INNER_EOF
{
  "heartbeat": "LIVE",
  "crash_restart_count": $CRASH_COUNT,
  "incident_count": $INCIDENT_COUNT,
  "current_operation": "$status",
  "last_heartbeat": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "current_commit": "$current",
  "last_known_good_commit": "$good"
}
INNER_EOF
}

LAST_KNOWN_GOOD="$(get_current_commit)"
CRASH_COUNT=0
INCIDENT_COUNT=0

log "Starting Guardian Supervisor. Last known good commit: $LAST_KNOWN_GOOD"

while true; do
  log "Starting Go Backend..."
  update_telemetry "STARTING"
  
  go run . &
  BACKEND_PID=$!
  START_TIME=$(date +%s)
  
  while kill -0 $BACKEND_PID 2>/dev/null; do
    update_telemetry "OBSERVING"
    sleep $CHECK_INTERVAL
    
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    if [ "$ELAPSED" -gt "$STABLE_TIME_SECONDS" ]; then
      NEW_COMMIT="$(get_current_commit)"
      if [ "$LAST_KNOWN_GOOD" != "$NEW_COMMIT" ]; then
        LAST_KNOWN_GOOD="$NEW_COMMIT"
        log "Commit $LAST_KNOWN_GOOD 60 seconds tak stable raha hai. Isay Last Known Good mark kar diya."
      fi
    fi
  done
  
  wait $BACKEND_PID
  EXIT_CODE=$?
  CRASH_COUNT=$((CRASH_COUNT + 1))
  
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  
  log "Backend crashed! Exit code: $EXIT_CODE. Zinda rehnay ka waqt: $ELAPSED seconds."
  
  if [ "$ELAPSED" -lt "$STABLE_TIME_SECONDS" ]; then
    INCIDENT_COUNT=$((INCIDENT_COUNT + 1))
    log "CRITICAL ALERT: Naye code ne server ko crash kar diya! AUTO-ROLLBACK shuru ho raha hai..."
    update_telemetry "ROLLBACK"
    
    git reset --hard "$LAST_KNOWN_GOOD"
    log "Successfully purane stable code ($LAST_KNOWN_GOOD) par wapas aa gaye hain."
  else
    log "Crash 60 seconds ke baad hua. Normal restart ho raha hai."
  fi
  
  sleep 3
done
