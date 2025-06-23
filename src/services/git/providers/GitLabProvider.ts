import {
  type GitAdapterCreateOrUpdateFile,
  type GitAdapterDeleteFile,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Gitlab, type ProjectSchema } from '@gitbeaker/rest'
import type { JWT } from '@auth/core/jwt'

export class GitLabProvider {
  static async refreshAccessToken(token: JWT): Promise<unknown> {
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
        svn_url: '',
        homepage: project.homepage,
        stargazers_count: project.star_count,
        watchers_count: 0,
        language: project.language,
        has_issues: project.issues_enabled,
        has_projects: false,
        has_downloads: false,
        has_wiki: project.wiki_enabled,
        has_pages: false,
        has_discussions: false,
        forks_count: project.forks_count,
        mirror_url: null,
        archived: project.archived,
        disabled: false,
        open_issues_count: project.open_issues_count,
        license: project.license
          ? {
              key: project.license.key,
              name: project.license.name,
              spdx_id: project.license.spdx_id,
              url: '',
              node_id: '',
            }
          : undefined,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: project.topics ?? [],
        visibility: project.visibility,
        forks: project.forks_count,
        open_issues: project.open_issues_count,
        watchers: 0,
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
      path,
      sha: file.last_commit_id,
      content: Buffer.from(file.content, 'base64').toString('utf-8'),
    }
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
      await client.RepositoryFiles.edit(repository, path, branch, {
        content,
        commit_message: 'Update ADR',
        last_commit_id: sha,
      })
    } catch {
      await client.RepositoryFiles.create(repository, path, branch, {
        content,
        commit_message: 'Create ADR',
      })
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
    return await client.RepositoryFiles.remove(repository, path, branch, {
      commit_message: message,
    })
  }
}
