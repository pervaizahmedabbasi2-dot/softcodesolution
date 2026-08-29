package guardian

import "sync"

type Engine struct {
	mu       sync.RWMutex
	state    GuardianState
	observer *Observer
	decision *DecisionEngine
}

func New() *Engine {
	return &Engine{
		observer: NewObserver(),
		decision: NewDecisionEngine(),
		state: GuardianState{
			Status: HealthUnknown,
		},
	}
}

func (e *Engine) Evaluate(
	component string,
	state HealthState,
	score float64,
	reason string,
) (Observation, Decision) {
	observation := e.observer.Observe(
		component,
		state,
		score,
		reason,
	)

	decision := e.decision.Decide(
		observation,
	)

	e.mu.Lock()
	defer e.mu.Unlock()

	e.state.Status = state
	e.state.ObservationCount++
	e.state.UpdatedAt = observation.ObservedAt
	e.state.LastDecision = decision

	switch state {
	case HealthDegraded:
		e.state.DegradedCount++
	case HealthCritical:
		e.state.CriticalCount++
	}

	return observation, decision
}

func (e *Engine) State() GuardianState {
	e.mu.RLock()
	defer e.mu.RUnlock()

	return e.state
}
