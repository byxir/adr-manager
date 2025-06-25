import {
  type GitAdapterCreateOrUpdateFile,
  type GitAdapterDeleteFile,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Gitlab, type ProjectSchema } from '@gitbeaker/rest'
import { type JWT } from 'next-auth/jwt'

export class GitLabProvider {
  static async refreshAccessToken(token: JWT): Promise<JWT> {
    const response = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH_GITLAB_ID!,
        client_secret: process.env.AUTH_GITLAB_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
    })

    const tokensOrError = await response.json()
    if (!response.ok) throw tokensOrError

    const newTokens = tokensOrError as {
      access_token: string
      expires_in: number
      refresh_token?: string
    }

    return {
      ...token,
      access_token: newTokens.access_token,
      expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
      refresh_token: newTokens.refresh_token ?? token.refresh_token,
    }
  }

  private static createClient(token: string) {
    return new Gitlab({ oauthToken: token })
  }

  static async getUserRepos({ accessToken }: GitAdapterMethodInterface) {
    const client = this.createClient(accessToken)
    const projects = await client.Projects.all({
      owned: true,
    })

    return projects.map((project: ProjectSchema) => {
      return {
        id: project.id,
        node_id: project.id.toString(),
        name: project.name,
        full_name: project.path_with_namespace,
        private: project.visibility !== 'public',
        owner: {
          login: project.namespace?.full_path,
          id: project.namespace?.id,
          node_id: project.namespace?.id?.toString(),
          avatar_url: project.avatar_url,
          url: project.web_url,
          html_url: project.web_url,
          type: 'User',
          user_view_type: 'User',
          site_admin: false,
        },
        html_url: project.web_url,
        description: project.description,
        pushed_at: project.last_activity_at,
        git_url: project.http_url_to_repo,
        ssh_url: project.ssh_url_to_repo,
        clone_url: project.http_url_to_repo,
        stargazers_count: project.star_count,
        has_issues: project.issues_enabled,
        visibility: project.visibility,
        default_branch: project.default_branch,
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true,
        },
      }
    })
  }

  static async getRepoTree({
    accessToken,
    repository,
    branch,
    owner,
  }: GitAdapterFetchTree) {
    const client = this.createClient(accessToken)
    const tree = await client.Repositories.allRepositoryTrees(
      `${owner}/${repository}`,
      {
        ref: branch,
        recursive: true,
      },
    )
    return { tree }
  }

  static async getFile({
    accessToken,
    repository,
    path,
    owner,
  }: GitAdapterFetchFile) {
    const client = this.createClient(accessToken)
    const file = await client.RepositoryFiles.show(
      `${owner}/${repository}`,
      path,
      'main',
    )

    return {
      name: path.split('/').pop(),
      path: decodeURIComponent(path),
      sha: file.last_commit_id,
      content: Buffer.from(file.content, 'base64').toString('utf-8'),
    }
  }

  static async getFileContributors({
    accessToken,
    repository,
    path,
    owner,
  }: GitAdapterFetchFile) {
    const client = this.createClient(accessToken)
    const commits = await client.Commits.all(`${owner}/${repository}`, {
      path,
    })

    return [
      ...new Map(
        commits.map((commit) => [
          commit.author_email,
          {
            username: commit.author_name,
            avatar: null, // GitLab does not provide the user's avatar or id for fetching.
          },
        ]),
      ).values(),
    ]
  }

  static async createOrUpdateFile({
    accessToken,
    repository,
    branch,
    path,
    content,
    sha,
  }: GitAdapterCreateOrUpdateFile) {
    const client = this.createClient(accessToken)

    try {
      await client.RepositoryFiles.edit(
        repository,
        path,
        branch,
        content,
        'Update ADR',
      )
    } catch {
      await client.RepositoryFiles.create(
        repository,
        path,
        branch,
        content,
        'create ADR',
      )
    }
  }

  static async deleteFile({
    accessToken,
    repository,
    path,
    branch,
    message,
  }: GitAdapterDeleteFile) {
    const client = this.createClient(accessToken)
    return await client.RepositoryFiles.remove(
      repository,
      path,
      branch,
      message,
    )
  }
}
