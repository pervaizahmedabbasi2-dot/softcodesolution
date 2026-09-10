package code_source_recovery

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

type fakeTokenProvider struct {
	token string
	err   error
}

func (f fakeTokenProvider) AuthorizationToken(context.Context) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	return f.token, nil
}

func TestDetectsCurrentCommit(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/repos/example/project/branches/main" {
				t.Fatalf("unexpected path: %s", r.URL.Path)
			}

			if r.Header.Get("Authorization") != "Bearer test-token" {
				t.Fatalf("authorization header missing")
			}

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(
				`{"name":"main","commit":{"sha":"ABCDEF0123456789ABCDEF0123456789ABCDEF01"}}`,
			))
		},
	))
	defer server.Close()

	detector := NewCurrentCommitDetector(
		"example/project",
		"main",
		server.URL,
		fakeTokenProvider{token: "test-token"},
	)

	snapshot, err := detector.Detect(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	if snapshot.Branch != "main" {
		t.Fatalf("unexpected branch: %s", snapshot.Branch)
	}

	if snapshot.SHA != "abcdef0123456789abcdef0123456789abcdef01" {
		t.Fatalf("unexpected SHA: %s", snapshot.SHA)
	}

	if snapshot.ObservedAt.IsZero() {
		t.Fatal("expected observation timestamp")
	}
}

func TestRejectsInvalidSHA(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(
				`{"name":"main","commit":{"sha":"914f5d2"}}`,
			))
		},
	))
	defer server.Close()

	detector := NewCurrentCommitDetector(
		"example/project",
		"main",
		server.URL,
		fakeTokenProvider{token: "test-token"},
	)

	_, err := detector.Detect(context.Background())
	if err == nil {
		t.Fatal("expected invalid SHA error")
	}
}

func TestRequiresTokenProvider(t *testing.T) {
	detector := NewCurrentCommitDetector(
		"example/project",
		"main",
		"https://api.github.com",
		nil,
	)

	_, err := detector.Detect(context.Background())
	if err == nil {
		t.Fatal("expected token provider error")
	}
}
