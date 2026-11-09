package guardian

import "time"

type HealthState string

const (
	HealthHealthy  HealthState = "HEALTHY"
	HealthDegraded HealthState = "DEGRADED"
	HealthCritical HealthState = "CRITICAL"
	HealthUnknown  HealthState = "UNKNOWN"
)

type Action string

const (
	ActionNone        Action = "NONE"
	ActionObserve     Action = "OBSERVE"
	ActionInvestigate Action = "INVESTIGATE"
	ActionRecover     Action = "RECOVER"
	ActionFailover    Action = "FAILOVER"
	ActionPromote     Action = "PROMOTE"
)

type Observation struct {
	Component  string
	State      HealthState
	Score      float64
	Reason     string
	ObservedAt time.Time
}

type Decision struct {
	Action     Action
	Confidence float64
	Reason     string
	Safe       bool
	DecidedAt  time.Time
}

// SupervisorTelemetry is the authoritative read-only Guardian
// supervisor telemetry contract exposed to the control plane.
type SupervisorTelemetry struct {
	Heartbeat         string    `json:"heartbeat"`
	CrashRestartCount int       `json:"crash_restart_count"`
	IncidentCount     int       `json:"incident_count"`
	CurrentOperation  string    `json:"current_operation"`
	LastHeartbeat     time.Time `json:"last_heartbeat"`
}

type GuardianState struct {
	Status           HealthState
	ObservationCount int
	DegradedCount    int
	CriticalCount    int
	LastDecision     Decision
	UpdatedAt        time.Time
}
