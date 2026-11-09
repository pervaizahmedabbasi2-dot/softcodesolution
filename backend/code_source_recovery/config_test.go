package code_source_recovery

import (
	"testing"
)

func TestRepositoryFromRemote(t *testing.T) {
	cases := []struct {
		name   string
		remote string
		want   string
	}{
		{
			name:   "https",
			remote: "https://github.com/pervaizahmedabbasi2-dot/softcodesolution.git",
			want:   "pervaizahmedabbasi2-dot/softcodesolution",
		},
		{
			name:   "ssh",
			remote: "git@github.com:pervaizahmedabbasi2-dot/softcodesolution.git",
			want:   "pervaizahmedabbasi2-dot/softcodesolution",
		},
		{
			name:   "ssh url",
			remote: "ssh://git@github.com/pervaizahmedabbasi2-dot/softcodesolution.git",
			want:   "pervaizahmedabbasi2-dot/softcodesolution",
		},
	}

	for _, tc := range cases {
		t.Run(
			tc.name,
			func(t *testing.T) {
				got :=
					repositoryFromRemote(
						tc.remote,
					)

				if got != tc.want {
					t.Fatalf(
						"got %q, want %q",
						got,
						tc.want,
					)
				}
			},
		)
	}
}

func TestGitHubConfigDefaults(t *testing.T) {

	t.Setenv(
		"SCS_GITHUB_REPOSITORY",
		"",
	)

	t.Setenv(
		"SCS_GITHUB_BRANCH",
		"",
	)

	t.Setenv(
		"SCS_GITHUB_TOKEN",
		"",
	)

	t.Setenv(
		"SCS_GITHUB_API_BASE_URL",
		"",
	)

	config :=
		LoadGitHubConfig(
			"https://github.com/pervaizahmedabbasi2-dot/softcodesolution.git",
		)

	if config.Repository !=
		"pervaizahmedabbasi2-dot/softcodesolution" {
		t.Fatalf(
			"unexpected repository: %s",
			config.Repository,
		)
	}

	if config.Branch !=
		DefaultGitHubBranch {
		t.Fatalf(
			"unexpected branch: %s",
			config.Branch,
		)
	}

	if config.APIBaseURL !=
		DefaultGitHubAPIBaseURL {
		t.Fatalf(
			"unexpected API base URL: %s",
			config.APIBaseURL,
		)
	}

	if config.Token != "" {
		t.Fatal(
			"token must default to empty",
		)
	}
}
