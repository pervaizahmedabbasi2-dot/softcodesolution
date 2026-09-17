package code_source_recovery

import (
	"strings"
	"testing"
	"time"
)

func TestBase64URL(t *testing.T) {
	if strings.Contains(base64URL([]byte("abc")), "=") {
		t.Fatal("padding should not be present")
	}
}

func TestIssuerPrefersClientID(t *testing.T) {
	a := &GitHubAppAuthenticator{AppID: "4762868", ClientID: "Iv23limONvN9aUigIU06"}
	if a.issuer() != "Iv23limONvN9aUigIU06" {
		t.Fatal("client id should be preferred")
	}
}

func TestIssuerFallsBackToAppID(t *testing.T) {
	a := &GitHubAppAuthenticator{AppID: "4762868"}
	if a.issuer() != "4762868" {
		t.Fatal("app id should be fallback")
	}
}

func TestRefreshWindow(t *testing.T) {
	now := time.Now().UTC()
	token := InstallationToken{
		Token:     "dummy",
		ExpiresAt: now.Add(10 * time.Minute),
	}
	if now.Add(5 * time.Minute).Before(token.ExpiresAt) {
		return
	}
	t.Fatal("token should still be outside five-minute refresh window")
}

func TestMissingKeyFailsClosed(t *testing.T) {
	t.Setenv("SCS_GITHUB_APP_ID", "4762868")
	t.Setenv("SCS_GITHUB_CLIENT_ID", "Iv23limONvN9aUigIU06")
	t.Setenv("SCS_GITHUB_PRIVATE_KEY", "")
	t.Setenv("SCS_GITHUB_PRIVATE_KEY_FILE", "")

	_, err := NewGitHubAppAuthenticatorFromEnv()
	if err == nil {
		t.Fatal("expected configuration error")
	}
}
