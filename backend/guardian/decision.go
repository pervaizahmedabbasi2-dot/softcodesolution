package guardian

import "time"

type DecisionEngine struct{}

func NewDecisionEngine() *DecisionEngine {
	return &DecisionEngine{}
}

func (d *DecisionEngine) Decide(
	observation Observation,
) Decision {
	now := time.Now().UTC()

	switch observation.State {
	case HealthHealthy:
		return Decision{
			Action:     ActionNone,
			Confidence: observation.Score,
			Reason:     "component healthy",
			Safe:       true,
			DecidedAt:  now,
		}

	case HealthDegraded:
		return Decision{
			Action:     ActionInvestigate,
			Confidence: 1 - observation.Score,
			Reason:     "degradation detected",
			Safe:       true,
			DecidedAt:  now,
		}

	case HealthCritical:
		return Decision{
			Action:     ActionRecover,
			Confidence: 1 - observation.Score,
			Reason:     "critical condition requires controlled recovery",
			Safe:       true,
			DecidedAt:  now,
		}

	default:
		return Decision{
			Action:     ActionObserve,
			Confidence: 0,
			Reason:     "unknown state",
			Safe:       true,
			DecidedAt:  now,
		}
	}
}
