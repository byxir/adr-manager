import {
  type GitAdapterCreateOrUpdateFile,
  type GitAdapterDeleteFile,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Octokit } from '@octokit/rest'
import type { JWT } from '@auth/core/jwt'

export class GitHubProvider {
  static async refreshAccessToken(token: JWT): Promise<unknown> {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.AUTH_GITHUB_ID!,
          client_secret: process.env.AUTH_GITHUB_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
        }),
      },
    )

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
      // Some providers only issue refresh tokens once, so preserve if we did not get a new one
      refresh_token: newTokens.refresh_token
        ? newTokens.refresh_token
        : token.refresh_token,
    }
  }

  private static createClient(token: string) {
    const enterpriseBase = process.env.NEXT_PUBLIC_GITHUB_ENTERPRISE_URL

    const baseUrl = enterpriseBase
      ? `${enterpriseBase.replace(/\/$/, '')}/api/v3`
      : 'https://api.github.com'

    return new Octokit({
      auth: token,
      baseUrl,
    })
  }

  static async getUserRepos({
    accessToken,
  }: GitAdapterMethodInterface): Promise<any> {
    const octokit = this.createClient(accessToken)

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data
  }

  static async getRepoTree({
    accessToken,
    owner,
    repository,
    branch,
  }: GitAdapterFetchTree) {
    const octokit = this.createClient(accessToken)

    return (
      await octokit.rest.git.getTree({
        owner,
        repo: repository,
        tree_sha: branch,
        recursive: 'true',
      })
    )?.data
  }

  static async deleteFile({
    accessToken,
    owner,
    repository,
    path,
    sha,
    message,
  }: GitAdapterDeleteFile) {
    const octokit = this.createClient(accessToken)

    const response = await octokit.rest.repos.deleteFile({
      owner,
      repository,
      path,
      message,
      sha,
    })

    return response.data
  }

  static async createOrUpdateFile({
    accessToken,
    owner,
    repository,
    branch,
    path,
    content,
    sha,
  }: GitAdapterCreateOrUpdateFile) {
    const octokit = this.createClient(accessToken)

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo: repository,
      branch,
      path,
      message: 'Create or update ADR',
      content: Buffer.from(content).toString('base64'),
      sha: sha,
    })
  }

  static async getFile({
    accessToken,
    owner,
    repository,
    path,
  }: GitAdapterFetchFile) {
    const octokit = this.createClient(accessToken)

    const file = await octokit.rest.repos.getContent({
      owner,
      repo: repository,
      path: decodeURIComponent(path),
    })

    const { content, sha, name } = file.data
    const parsedContent = Buffer.from(content, 'base64').toString('utf-8')

    return { name, path, sha, content: parsedContent }
  }

  static async getFileContributors({
    accessToken,
    owner,
    repository,
    path,
  }: GitAdapterFetchFile) {
    const octokit = this.createClient(accessToken)

    const commits = await octokit.rest.repos.listCommits({
      owner,
      repo: repository,
      path: decodeURIComponent(path),
    })

    const contributors = [
      ...new Map(
        commits.data.map((commit) => [
          commit.author?.login,
          {
            username: commit.author?.login,
            avatar: commit.author?.avatar_url,
            url: commit.author?.html_url,
          },
        ]),
      ).values(),
    ]

    return contributors
  }
}
