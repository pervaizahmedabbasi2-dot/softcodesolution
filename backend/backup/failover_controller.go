package backup

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type FailoverState string

const (
	FailoverActive       FailoverState = "ACTIVE"
	FailoverStandbyReady FailoverState = "STANDBY_READY"
	FailoverEvaluating   FailoverState = "EVALUATING"
	FailoverPromoting    FailoverState = "PROMOTING"
	FailoverRecovered    FailoverState = "RECOVERED"
	FailoverBlocked      FailoverState = "BLOCKED"
	FailoverFailed       FailoverState = "FAILED"
)

type FailoverStatus struct {
	State              FailoverState `json:"state"`
	ActiveNode         string        `json:"active_node"`
	StandbyConfigured  bool          `json:"standby_configured"`
	PromotionAvailable bool          `json:"promotion_available"`
	LastTransition     time.Time     `json:"last_transition"`
	Message            string        `json:"message"`
}

type FailoverController struct {
	mu     sync.RWMutex
	status FailoverStatus
}

func NewFailoverController() *FailoverController {
	node := strings.TrimSpace(
		os.Getenv("SCS_NODE_ID"),
	)

	if node == "" {
		node = "active-node"
	}

	standbyConfigured :=
		strings.TrimSpace(
			os.Getenv("SCS_HOT_STANDBY_DSN"),
		) != ""

	promotionAvailable :=
		strings.TrimSpace(
			os.Getenv("SCS_FAILOVER_PROMOTE_COMMAND"),
		) != ""

	state := FailoverActive
	message := "Active node healthy."

	if !standbyConfigured {
		state = FailoverBlocked
		message =
			"Hot Standby is not configured."
	} else if !promotionAvailable {
		state = FailoverStandbyReady
		message =
			"Hot Standby configured; promotion command is not configured."
	}

	return &FailoverController{
		status: FailoverStatus{
			State:              state,
			ActiveNode:         node,
			StandbyConfigured:  standbyConfigured,
			PromotionAvailable: promotionAvailable,
			LastTransition:     time.Now().UTC(),
			Message:            message,
		},
	}
}

func (f *FailoverController) Status() FailoverStatus {
	f.mu.RLock()
	defer f.mu.RUnlock()

	return f.status
}

func (f *FailoverController) Evaluate(
	ctx context.Context,
) (FailoverStatus, error) {

	select {
	case <-ctx.Done():
		return FailoverStatus{}, ctx.Err()
	default:
	}

	f.mu.Lock()
	defer f.mu.Unlock()

	f.status.LastTransition =
		time.Now().UTC()

	if !f.status.StandbyConfigured {
		f.status.State =
			FailoverBlocked

		f.status.Message =
			"Automatic failover blocked: Hot Standby is not configured."

		return f.status,
			errors.New("hot standby is not configured")
	}

	if !f.status.PromotionAvailable {
		f.status.State =
			FailoverStandbyReady

		f.status.Message =
			"Hot Standby is ready but promotion command is not configured."

		return f.status,
			errors.New("promotion command is not configured")
	}

	f.status.State =
		FailoverEvaluating

	f.status.Message =
		"Failover prerequisites verified."

	return f.status, nil
}

func (f *FailoverController) Promote(
	ctx context.Context,
) (FailoverStatus, error) {

	f.mu.Lock()

	if !f.status.StandbyConfigured {
		f.status.State =
			FailoverBlocked

		f.status.Message =
			"Promotion blocked: Hot Standby is not configured."

		status := f.status

		f.mu.Unlock()

		return status,
			errors.New("hot standby is not configured")
	}

	command :=
		strings.TrimSpace(
			os.Getenv("SCS_FAILOVER_PROMOTE_COMMAND"),
		)

	if command == "" {
		f.status.State =
			FailoverStandbyReady

		f.status.Message =
			"Promotion blocked: promotion command is not configured."

		status := f.status

		f.mu.Unlock()

		return status,
			errors.New("promotion command is not configured")
	}

	f.status.State =
		FailoverPromoting

	f.status.LastTransition =
		time.Now().UTC()

	f.status.Message =
		"Standby promotion in progress."

	f.mu.Unlock()

	cmd :=
		exec.CommandContext(
			ctx,
			"sh",
			"-c",
			command,
		)

	output, err :=
		cmd.CombinedOutput()

	f.mu.Lock()
	defer f.mu.Unlock()

	f.status.LastTransition =
		time.Now().UTC()

	if err != nil {
		f.status.State =
			FailoverFailed

		f.status.Message =
			"Standby promotion failed: " +
				strings.TrimSpace(
					string(output),
				)

		return f.status, err
	}

	f.status.State =
		FailoverRecovered

	f.status.Message =
		"Standby promotion completed successfully."

	return f.status, nil
}

func (f *FailoverController) MarkRecovered(
	message string,
) FailoverStatus {

	f.mu.Lock()
	defer f.mu.Unlock()

	f.status.State =
		FailoverRecovered

	f.status.LastTransition =
		time.Now().UTC()

	f.status.Message =
		message

	return f.status
}
