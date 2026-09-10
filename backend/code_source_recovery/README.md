# Code Source Recovery

## GitHub configuration

The GitHub source is configured through environment variables.

- `SCS_GITHUB_REPOSITORY`
- `SCS_GITHUB_BRANCH`
- `SCS_GITHUB_TOKEN`
- `SCS_GITHUB_API_BASE_URL`

When `SCS_GITHUB_REPOSITORY` is not supplied, the service
derives the repository from the Git `origin` remote.

The default branch is `main`.

The GitHub token is never stored in source code.
For private repositories it must be supplied through the
runtime secret/environment configuration.

Commit IDs are deliberately not configured here.
The current commit will be discovered dynamically in Point 3.

Existing Data Protection Layers 1-5 remain independent.
