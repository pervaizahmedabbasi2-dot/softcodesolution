package code_source_recovery

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var ErrCurrentCommitUnavailable = errors.New("current GitHub commit unavailable")

type TokenProvider interface {
	AuthorizationToken(context.Context) (string, error)
}

type CommitSnapshot struct {
	Repository string
	Branch     string
	SHA        string
	ObservedAt time.Time
}

type branchResponse struct {
	Name   string `json:"name"`
	Commit struct {
		SHA string `json:"sha"`
	} `json:"commit"`
}

type CurrentCommitDetector struct {
	Repository    string
	Branch        string
	APIBaseURL    string
	TokenProvider TokenProvider
	HTTPClient    *http.Client
}

func NewCurrentCommitDetector(
	repository string,
	branch string,
	apiBaseURL string,
	provider TokenProvider,
) *CurrentCommitDetector {

	if strings.TrimSpace(branch) == "" {
		branch = "main"
	}

	if strings.TrimSpace(apiBaseURL) == "" {
		apiBaseURL = "https://api.github.com"
	}

	return &CurrentCommitDetector{
		Repository:    strings.TrimSpace(repository),
		Branch:        branch,
		APIBaseURL:    strings.TrimRight(apiBaseURL, "/"),
		TokenProvider: provider,
		HTTPClient:    &http.Client{Timeout: 20 * time.Second},
	}
}

func validFullSHA(value string) bool {
	return regexp.MustCompile(`^[0-9a-fA-F]{40}$`).MatchString(value)
}

func (d *CurrentCommitDetector) Detect(ctx context.Context) (CommitSnapshot, error) {
	if d.Repository == "" {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: repository not configured",
			ErrCurrentCommitUnavailable,
		)
	}

	if d.TokenProvider == nil {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: token provider unavailable",
			ErrCurrentCommitUnavailable,
		)
	}

	token, err := d.TokenProvider.AuthorizationToken(ctx)
	if err != nil {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: authentication: %v",
			ErrCurrentCommitUnavailable,
			err,
		)
	}

	endpoint := fmt.Sprintf(
		"%s/repos/%s/branches/%s",
		d.APIBaseURL,
		d.Repository,
		d.Branch,
	)

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		endpoint,
		nil,
	)
	if err != nil {
		return CommitSnapshot{}, err
	}

	request.Header.Set(
		"Accept",
		"application/vnd.github+json",
	)

	request.Header.Set(
		"X-GitHub-Api-Version",
		"2026-03-10",
	)

	request.Header.Set(
		"User-Agent",
		"SoftCodeSolution-CodeSourceRecovery",
	)

	request.Header.Set(
		"Authorization",
		"Bearer "+token,
	)

	response, err := d.HTTPClient.Do(request)
	if err != nil {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: request: %v",
			ErrCurrentCommitUnavailable,
			err,
		)
	}

	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: GitHub HTTP %d",
			ErrCurrentCommitUnavailable,
			response.StatusCode,
		)
	}

	var payload branchResponse

	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: invalid GitHub response: %v",
			ErrCurrentCommitUnavailable,
			err,
		)
	}

	if !validFullSHA(payload.Commit.SHA) {
		return CommitSnapshot{}, fmt.Errorf(
			"%w: invalid commit SHA returned by GitHub",
			ErrCurrentCommitUnavailable,
		)
	}

	branch := payload.Name
	if branch == "" {
		branch = d.Branch
	}

	return CommitSnapshot{
		Repository: d.Repository,
		Branch:     branch,
		SHA:        strings.ToLower(payload.Commit.SHA),
		ObservedAt: time.Now().UTC(),
	}, nil
}
