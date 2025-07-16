# ADR-Manager ![General cypress report](https://github.com/adr/adr-manager/workflows/General%20cypress%20report/badge.svg?branch=cypress-integration) [![GitHub license](https://img.shields.io/github/license/adr/adr-manager)](https://github.com/adr/adr-manager/blob/main/LICENSE) [![GitHub last commit](https://img.shields.io/github/last-commit/adr/adr-manager)](https://github.com/adr/adr-manager/commits/main) [![GitHub issues](https://img.shields.io/github/issues/adr/adr-manager)](https://github.com/adr/adr-manager/issues) [![GitHub stars](https://img.shields.io/github/stars/adr/adr-manager)](https://github.com/adr/adr-manager/stargazers)

> A web-based application for the efficient creation and management of [architectural decision records (ADRs)](https://adr.github.io) in Markdown (MADR)

## Description

[MADR](https://adr.github.io/madr/) is a Markdown template for quickly capturing architectural decisions.
It offers a naming scheme and template to keep the layout of recorded decisions consistent.
Each decision is stored in a separate file.
The ADR Manager currently only supports the management of MADRs stored in the folder `docs/adr` in GitHub repositories.

## Quick Start

You can find the tool at [https://adr.github.io/adr-manager.](https://adr.github.io/adr-manager.)

## Supported Browsers

Currently, the tool has been successfully tested in Chrome, Safari and Firefox.

### Usage

1. After opening the tool, connect to your selected Git provider. The tool needs your permission to access your Git repositories and email address.
2. Select any given Git repository. If your account does not have access to a repository with MADRs, you can simply fork one, e.g., [https://github.com/JabRef/jabref](https://github.com/JabRef/jabref) or [https://github.com/adr/adr-log](https://github.com/adr/adr-log).
3. Now, you can edit any files in `docs/adr` of the GitHub repository.
   Edit existing ADRs or create new ones.
   One of the most important features is the MADR Editor that allows you to quickly draft a MADR while ensuring a consistent format.
4. Do not forget to push your changes to Git, once you are done with editing the files.

## Development

### Prerequisites

- Node.js and pnpm
- A GitHub or Gitlab account with access to a repository with MADRs

### Installation

To run the project locally, follow these steps:

1. Clone this repository.
2. Install dependencies with `pnpm install`.
3. Compile and start the application with `pnpm build` and then `pnpm start`.

Note that, even when you run it locally, you need to connect to GitHub to use any functionality.

### Environment Variables

Please copy the `.env.example` file and create a `.env` file filling in the required fields.

```dotenv
AUTH_URL="https://example.com" # Your site's domain, necessary for auth to work
AUTH_SECRET="" # This is the secret used for signing jwt tokens, do not share this secret, and make it secure.

# GitHub Integration
NEXT_PUBLIC_GITHUB_LOGIN_ENABLED="true" # Set this to false to disable logins of this provider
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
GITHUB_HOST_URL="" # Set this to use github enterprise, this will override GitHab's default url.


# GitLab Integration
NEXT_PUBLIC_GITLAB_LOGIN_ENABLED="true" # Set this to false to disable logins of this provider
AUTH_GITLAB_ID=""
AUTH_GITLAB_SECRET=""
GITLAB_HOST_URL="" # Set this to use your own GitLab instance, this will override GitLab's default url.
```

### Using End-2-End Tests Locally

We use [Cypress](https://www.cypress.io/) for e2e testing.
The CI pipeline provides the necessary Oauth `authId` as an ENV variable.
Locally, however, you'll need to provide one yourself.
You can either set `CYPRESS_OAUTH_E2E_AUTH_ID` and `CYPRESS_USER` containing the `authId` and `user` or create a `cypress.env.json` file and fill it with the following content:

```json
{
  "OAUTH_E2E_AUTH_ID": "*********",
  "USER": "***********"
}
```

The value of `OAUTH_E2E_AUTH_ID` and `USER` needs to be a valid `authId` and `user` from an active OAuth session, which you can obtain in the local storage (Chrome developer console -> Application -> Storage -> Local Storage -> `http://localhost:8080` -> `authId`, `user`)
The involved GitHub account also needs to have developer access to the repo `adr/adr-test-repository-empty`.
Lastly, don't forget to start the app before running the e2e tests (`npm start`).

### Testing

to run tests, run `npm test`

### Authentication Setup

The project uses \[OAuth] alongside [Auth.js](https://authjs.dev/) for authenticating with Git providers.
If you do not want to use this instance, you can easily set up your own by following these steps:

### GitHub Integration

1. Go to the [GitHub Developer Settings](https://github.com/settings/developers)
   → Navigate to **OAuth Apps** → **New OAuth App**.
2. Create a **new OAuth application** with the following settings:
   - **Application Name:** Your App Name (e.g., ADR Manager)
   - **Homepage URL:**
     [`http://example.com`](http://example.com)
   - **Authorization callback URL:**
     [`http://example.com/api/auth/callback/github`](http://example.com/api/auth/callback/github)
3. After creation, **copy the `Client ID` and `Client Secret`**.
4. Add these to your `.env` file:
   ```dotenv
   NEXT_PUBLIC_GITHUB_LOGIN_ENABLED="true"
   AUTH_GITHUB_ID=your_client_id
   AUTH_GITHUB_SECRET=your_client_secret
   GITHUB_HOST_URL=https://github.com  # (optional, only if using GitHub Enterprise)
   ```
5. Make sure the callback URL matches exactly in both GitHub and your Auth.js configuration:http://example.com/api/auth/callback/github

### GitLab Integration

1. Go to your GitLab instance (e.g., [https://gitlab.com](https://gitlab.com) or your self-managed instance)
   → Navigate to **User Settings → Applications** or the [GitLab Applications Page](https://gitlab.com/-/profile/applications).
2. Create a **new OAuth application** with the following settings:
   - **Name:** Your App Name (e.g., ADR Manager)
   - **Redirect URI:**
     [`http://example.com/api/auth/callback/gitlab`](http://example.com/api/auth/callback/gitlab)
   - **Scopes (check these):**
     - ✅ `read_user` (required to read profile data)
     - ✅ `api` (required to access repositories, push files, and manage content)
     - ✅ `write_repository` (required to access repositories, push files, and manage content)
3. After creation, **copy the `Application ID` and `Secret`**.
4. Add these to your `.env` file:
   ```dotenv
   NEXT_PUBLIC_GITLAB_LOGIN_ENABLED="true"
   AUTH_GITLAB_ID=your_application_id
   AUTH_GITLAB_SECRET=your_application_secret
   GITLAB_HOST_URL=https://gitlab.com
   ```
   > If using a **self-managed GitLab instance**, replace [`https://gitlab.com`](https://gitlab.com) with your instance URL.
5. Make sure the callback URL matches exactly in both GitLab and your Auth.js configuration: [http://example.com/api/auth/callback/gitlab](http://example.com/api/auth/callback/gitlab)

## Project Context

This project was started as an undergraduate research project at the Institute of Software Engineering of the University of Stuttgart, Germany.
It was also submitted to the [ICSE Score Contest 2021](https://conf.researchr.org/home/icse-2021/score-2021).
Since then, it has been given over to the [ADR organization on GitHub](https://github.com/adr), where it is maintained and extended.
