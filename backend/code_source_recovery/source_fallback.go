package code_source_recovery

import "errors"

var ErrNoUsableSource = errors.New("no usable recovery source available")

type SourceCandidate struct {
	Name              string
	Commit            string
	Available         bool
	IntegrityVerified bool
}

type FallbackDecision struct {
	SelectedSource string
	SelectedCommit string
	Reason         string
	Ready          bool
}

type SourceFallbackSelector struct{}

func NewSourceFallbackSelector() *SourceFallbackSelector {
	return &SourceFallbackSelector{}
}

func (s *SourceFallbackSelector) Select(
	local SourceCandidate,
	github SourceCandidate,
	lastKnownGood SourceCandidate,
) (FallbackDecision, error) {

	if local.Available && local.IntegrityVerified {
		return FallbackDecision{
			SelectedSource: "local",
			SelectedCommit: local.Commit,
			Reason:         "local source is available and integrity verified",
			Ready:          true,
		}, nil
	}

	if github.Available && github.IntegrityVerified {
		return FallbackDecision{
			SelectedSource: "github",
			SelectedCommit: github.Commit,
			Reason:         "local source unavailable or unverified; GitHub source is available and integrity verified",
			Ready:          true,
		}, nil
	}

	if lastKnownGood.Available && lastKnownGood.IntegrityVerified {
		return FallbackDecision{
			SelectedSource: "last_known_good",
			SelectedCommit: lastKnownGood.Commit,
			Reason:         "local and GitHub sources unavailable or unverified; using last-known-good source",
			Ready:          true,
		}, nil
	}

	return FallbackDecision{
		SelectedSource: "none",
		Reason:         "no verified recovery source is available",
		Ready:          false,
	}, ErrNoUsableSource
}
