package guardian

import "time"

type Observer struct{}

func NewObserver() *Observer {
	return &Observer{}
}

func (o *Observer) Observe(
	component string,
	state HealthState,
	score float64,
	reason string,
) Observation {
	if score < 0 {
		score = 0
	}

	if score > 1 {
		score = 1
	}

	return Observation{
		Component:  component,
		State:      state,
		Score:      score,
		Reason:     reason,
		ObservedAt: time.Now().UTC(),
	}
}
