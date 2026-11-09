package guardian

import "testing"

func TestHealthyObservation(t *testing.T) {
	g := New()

	observation, decision := g.Evaluate(
		"test",
		HealthHealthy,
		1.0,
		"healthy",
	)

	if observation.State != HealthHealthy {
		t.Fatalf("expected HEALTHY")
	}

	if decision.Action != ActionNone {
		t.Fatalf("expected NONE action")
	}
}

func TestDegradedObservation(t *testing.T) {
	g := New()

	_, decision := g.Evaluate(
		"test",
		HealthDegraded,
		0.4,
		"degraded",
	)

	if decision.Action != ActionInvestigate {
		t.Fatalf("expected INVESTIGATE action")
	}
}

func TestCriticalObservation(t *testing.T) {
	g := New()

	_, decision := g.Evaluate(
		"test",
		HealthCritical,
		0.1,
		"critical",
	)

	if decision.Action != ActionRecover {
		t.Fatalf("expected RECOVER action")
	}
}

func TestProductionMutationIsBlocked(t *testing.T) {
	blocked := []Action{
		ActionRecover,
		ActionFailover,
		ActionPromote,
	}

	for _, action := range blocked {
		if ProductionMutationAllowed(action) {
			t.Fatalf(
				"production mutation must remain blocked for %s",
				action,
			)
		}
	}
}
