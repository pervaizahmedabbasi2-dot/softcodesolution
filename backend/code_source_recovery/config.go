package code_source_recovery

import (
	"net/url"
	"os"
	"strings"
)

const (
	EnvGitHubRepository = "SCS_GITHUB_REPOSITORY"
	EnvGitHubBranch     = "SCS_GITHUB_BRANCH"
	EnvGitHubToken      = "SCS_GITHUB_TOKEN"
	EnvGitHubAPIBaseURL = "SCS_GITHUB_API_BASE_URL"

	DefaultGitHubBranch = "main"

	DefaultGitHubAPIBaseURL = "https://api.github.com"
)

type GitHubConfig struct {
	Repository string
	Branch     string
	Token      string
	APIBaseURL string
}

func LoadGitHubConfig(
	originURL string,
) GitHubConfig {

	repository :=
		strings.TrimSpace(
			os.Getenv(
				EnvGitHubRepository,
			),
		)

	if repository == "" {
		repository =
			repositoryFromRemote(
				originURL,
			)
	}

	branch :=
		strings.TrimSpace(
			os.Getenv(
				EnvGitHubBranch,
			),
		)

	if branch == "" {
		branch =
			DefaultGitHubBranch
	}

	apiBaseURL :=
		strings.TrimSpace(
			os.Getenv(
				EnvGitHubAPIBaseURL,
			),
		)

	if apiBaseURL == "" {
		apiBaseURL =
			DefaultGitHubAPIBaseURL
	}

	return GitHubConfig{
		Repository: repository,
		Branch:     branch,
		Token: os.Getenv(
			EnvGitHubToken,
		),
		APIBaseURL: strings.TrimRight(
			apiBaseURL,
			"/",
		),
	}
}

func repositoryFromRemote(
	remote string,
) string {

	remote =
		strings.TrimSpace(
			remote,
		)

	remote =
		strings.TrimSuffix(
			remote,
			".git",
		)

	switch {
	case strings.HasPrefix(
		remote,
		"git@github.com:",
	):
		return strings.TrimPrefix(
			remote,
			"git@github.com:",
		)

	case strings.HasPrefix(
		remote,
		"ssh://git@github.com/",
	):
		return strings.TrimPrefix(
			remote,
			"ssh://git@github.com/",
		)

	case strings.HasPrefix(
		remote,
		"https://github.com/",
	):
		return strings.TrimPrefix(
			remote,
			"https://github.com/",
		)

	case strings.HasPrefix(
		remote,
		"http://github.com/",
	):
		return strings.TrimPrefix(
			remote,
			"http://github.com/",
		)

	default:
		if parsed, err :=
			url.Parse(remote); err == nil &&
			strings.EqualFold(
				parsed.Host,
				"github.com",
			) {
			return strings.TrimPrefix(
				parsed.Path,
				"/",
			)
		}

		return ""
	}
}
