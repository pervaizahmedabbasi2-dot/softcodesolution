package guardian

import "testing"

func TestLiveGuardianIntegration(t *testing.T) {
	g := New()

	healthyObservation, healthyDecision := g.Evaluate(
		"postgresql",
		HealthHealthy,
		1.0,
		"live healthy state",
	)

	if healthyObservation.State != HealthHealthy {
		t.Fatalf("healthy state was not recorded")
	}

	if healthyDecision.Action != ActionNone {
		t.Fatalf("healthy state produced unexpected action: %s", healthyDecision.Action)
	}

	degradedObservation, degradedDecision := g.Evaluate(
		"postgresql",
		HealthDegraded,
		0.45,
		"live degradation simulation",
	)

	if degradedObservation.State != HealthDegraded {
		t.Fatalf("degraded state was not recorded")
	}

	if degradedDecision.Action != ActionInvestigate {
		t.Fatalf("degraded state produced unexpected action: %s", degradedDecision.Action)
	}

	criticalObservation, criticalDecision := g.Evaluate(
		"postgresql",
		HealthCritical,
		0.10,
		"live critical failure simulation",
	)

	if criticalObservation.State != HealthCritical {
		t.Fatalf("critical state was not recorded")
	}

	if criticalDecision.Action != ActionRecover {
		t.Fatalf("critical state produced unexpected action: %s", criticalDecision.Action)
	}

	if ProductionMutationAllowed(ActionRecover) {
		t.Fatalf("production recovery mutation must remain blocked")
	}

	if ProductionMutationAllowed(ActionFailover) {
		t.Fatalf("production failover mutation must remain blocked")
	}

	if ProductionMutationAllowed(ActionPromote) {
		t.Fatalf("production promotion mutation must remain blocked")
	}

	state := g.State()

	if state.ObservationCount != 3 {
		t.Fatalf("expected 3 observations, got %d", state.ObservationCount)
	}

	if state.DegradedCount != 1 {
		t.Fatalf("expected 1 degraded observation, got %d", state.DegradedCount)
	}

	if state.CriticalCount != 1 {
		t.Fatalf("expected 1 critical observation, got %d", state.CriticalCount)
	}

	if state.Status != HealthCritical {
		t.Fatalf("expected final state CRITICAL, got %s", state.Status)
	}

	if state.LastDecision.Action != ActionRecover {
		t.Fatalf("expected final decision RECOVER, got %s", state.LastDecision.Action)
	}
}
