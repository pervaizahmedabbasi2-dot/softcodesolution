package code_source_recovery

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

var (
	ErrGitHubAppNotConfigured = errors.New("github app authentication is not configured")
	ErrGitHubAuthentication   = errors.New("github app authentication failed")
)

type InstallationToken struct {
	Token     string
	ExpiresAt time.Time
}

type GitHubAppAuthenticator struct {
	AppID          string
	ClientID       string
	InstallationID string
	Repository     string
	Branch         string
	PrivateKeyPEM  string
	APIBaseURL     string
	Client         *http.Client
	mu             sync.Mutex
	token          InstallationToken
}

func NewGitHubAppAuthenticatorFromEnv() (*GitHubAppAuthenticator, error) {
	key := strings.TrimSpace(os.Getenv("SCS_GITHUB_PRIVATE_KEY"))

	if key == "" {
		file := strings.TrimSpace(os.Getenv("SCS_GITHUB_PRIVATE_KEY_FILE"))
		if file != "" {
			data, err := os.ReadFile(file)
			if err != nil {
				return nil, fmt.Errorf("%w: %v", ErrGitHubAppNotConfigured, err)
			}
			key = string(data)
		}
	}

	if key == "" {
		return nil, fmt.Errorf("%w: private key missing", ErrGitHubAppNotConfigured)
	}

	appID := strings.TrimSpace(os.Getenv("SCS_GITHUB_APP_ID"))
	clientID := strings.TrimSpace(os.Getenv("SCS_GITHUB_CLIENT_ID"))

	if appID == "" && clientID == "" {
		return nil, fmt.Errorf("%w: app/client id missing", ErrGitHubAppNotConfigured)
	}

	branch := strings.TrimSpace(os.Getenv("SCS_GITHUB_BRANCH"))
	if branch == "" {
		branch = "main"
	}

	api := strings.TrimSpace(os.Getenv("SCS_GITHUB_API_BASE_URL"))
	if api == "" {
		api = "https://api.github.com"
	}

	return &GitHubAppAuthenticator{
		AppID:          appID,
		ClientID:       clientID,
		InstallationID: strings.TrimSpace(os.Getenv("SCS_GITHUB_INSTALLATION_ID")),
		Repository:     strings.TrimSpace(os.Getenv("SCS_GITHUB_REPOSITORY")),
		Branch:         branch,
		PrivateKeyPEM:  key,
		APIBaseURL:     strings.TrimRight(api, "/"),
		Client:         &http.Client{Timeout: 25 * time.Second},
	}, nil
}

func parseRSAPrivateKey(value string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(value))
	if block == nil {
		return nil, fmt.Errorf("%w: invalid PEM", ErrGitHubAppNotConfigured)
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid private key", ErrGitHubAppNotConfigured)
	}

	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("%w: private key is not RSA", ErrGitHubAppNotConfigured)
	}

	return key, nil
}

func base64URL(value []byte) string {
	return strings.TrimRight(base64.RawURLEncoding.EncodeToString(value), "=")
}

func (a *GitHubAppAuthenticator) issuer() string {
	if a.ClientID != "" {
		return a.ClientID
	}
	return a.AppID
}

func (a *GitHubAppAuthenticator) appJWT(now time.Time) (string, error) {
	key, err := parseRSAPrivateKey(a.PrivateKeyPEM)
	if err != nil {
		return "", err
	}

	header := map[string]string{
		"alg": "RS256",
		"typ": "JWT",
	}

	claims := map[string]any{
		"iat": now.Add(-60 * time.Second).Unix(),
		"exp": now.Add(9 * time.Minute).Unix(),
		"iss": a.issuer(),
	}

	h, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	c, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	unsigned := base64URL(h) + "." + base64URL(c)
	digest := sha256.Sum256([]byte(unsigned))

	signature, err := rsa.SignPKCS1v15(rand.Reader, key, cryptoHashSHA256, digest[:])
	if err != nil {
		return "", err
	}

	return unsigned + "." + base64URL(signature), nil
}

func (a *GitHubAppAuthenticator) httpRequest(ctx context.Context, method, endpoint, bearer string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, a.APIBaseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2026-03-10")
	req.Header.Set("User-Agent", "SoftCodeSolution-CodeSourceRecovery")

	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}

	return a.Client.Do(req)
}

func (a *GitHubAppAuthenticator) installationID(ctx context.Context) (int64, error) {
	if a.InstallationID != "" {
		id, err := strconv.ParseInt(a.InstallationID, 10, 64)
		if err == nil && id > 0 {
			return id, nil
		}
	}

	jwt, err := a.appJWT(time.Now().UTC())
	if err != nil {
		return 0, err
	}

	response, err := a.httpRequest(ctx, http.MethodGet, "/app/installations?per_page=100", jwt)
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrGitHubAuthentication, err)
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return 0, fmt.Errorf("%w: installation discovery HTTP %d", ErrGitHubAuthentication, response.StatusCode)
	}

	var installations []struct {
		ID int64 `json:"id"`
	}

	if err := json.NewDecoder(response.Body).Decode(&installations); err != nil {
		return 0, err
	}

	for _, item := range installations {
		if item.ID > 0 {
			return item.ID, nil
		}
	}

	return 0, fmt.Errorf("%w: no installation found", ErrGitHubAuthentication)
}

func (a *GitHubAppAuthenticator) renew(ctx context.Context) (InstallationToken, error) {
	id, err := a.installationID(ctx)
	if err != nil {
		return InstallationToken{}, err
	}

	jwt, err := a.appJWT(time.Now().UTC())
	if err != nil {
		return InstallationToken{}, err
	}

	response, err := a.httpRequest(
		ctx,
		http.MethodPost,
		"/app/installations/"+strconv.FormatInt(id, 10)+"/access_tokens",
		jwt,
	)
	if err != nil {
		return InstallationToken{}, fmt.Errorf("%w: %v", ErrGitHubAuthentication, err)
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return InstallationToken{}, fmt.Errorf("%w: token HTTP %d", ErrGitHubAuthentication, response.StatusCode)
	}

	var raw map[string]any
	if err := json.NewDecoder(response.Body).Decode(&raw); err != nil {
		return InstallationToken{}, err
	}

	token, _ := raw["token"].(string)
	expiresText, _ := raw["expires_at"].(string)

	if strings.TrimSpace(token) == "" || expiresText == "" {
		return InstallationToken{}, fmt.Errorf("%w: invalid token response", ErrGitHubAuthentication)
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresText)
	if err != nil {
		return InstallationToken{}, err
	}

	a.InstallationID = strconv.FormatInt(id, 10)

	return InstallationToken{
		Token:     token,
		ExpiresAt: expiresAt.UTC(),
	}, nil
}

func (a *GitHubAppAuthenticator) Token(ctx context.Context) (InstallationToken, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	now := time.Now().UTC()

	if a.token.Token != "" && now.Add(5*time.Minute).Before(a.token.ExpiresAt) {
		return a.token, nil
	}

	token, err := a.renew(ctx)
	if err != nil {
		return InstallationToken{}, err
	}

	a.token = token
	return token, nil
}

const cryptoHashSHA256 = 5

func (a *GitHubAppAuthenticator) AuthorizationToken(ctx context.Context) (string, error) {
	token, err := a.Token(ctx)
	if err != nil {
		return "", err
	}
	return token.Token, nil
}
