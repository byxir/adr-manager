import {
  type GitAdapterCreateOrUpdateFile,
  type GitAdapterDeleteFile,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Gitlab, type ProjectSchema } from '@gitbeaker/rest'
import { type JWT } from 'next-auth/jwt'
import type { Repo } from '@/definitions/types'

const baseUrl = process.env.GITLAB_HOST_URL ?? 'https://gitlab.com'

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
    return new Gitlab({ host: baseUrl, oauthToken: token })
  }

  static async getUserRepos({ accessToken }: GitAdapterMethodInterface) {
    const client = this.createClient(accessToken)
    const projects = await client.Projects.all({
      owned: true,
    })

    return projects.map((project: ProjectSchema) => {
      return {
        id: project.id,
        name: project.name,
        full_name: project.path_with_namespace,
        description: project.description,
        private: project.visibility !== 'public',
        default_branch: project.default_branch,
        last_updated_at: project.last_activity_at,
        stars_count: project.star_count,
        forks_count: project.forks_count,
        owner: {
          id: project.namespace?.id,
          name: project.namespace?.full_path,
          avatar: project.avatar_url ?? project.namespace.avatar_url,
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
    owner,
    branch,
    path,
    content,
    sha,
  }: GitAdapterCreateOrUpdateFile) {
    const client = this.createClient(accessToken)

    const projectId = `${owner}/${repository}`

    try {
      await client.RepositoryFiles.edit(
        projectId,
        path,
        branch,
        content,
        'Update ADR',
      )
    } catch {
      await client.RepositoryFiles.create(
        projectId,
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
