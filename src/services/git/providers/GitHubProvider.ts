import {
  type GitAdapterCreateOrUpdateFile,
  type GitAdapterDeleteFile,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Octokit } from '@octokit/rest'
import { type JWT } from 'next-auth/jwt'

const hostUrl = process.env.GITHUB_HOST_URL
const baseUrl = hostUrl
  ? `${hostUrl.replace(/\/$/, '')}/api/v3`
  : 'https://api.github.com'

export class GitHubProvider {
  static async refreshAccessToken(token: JWT): Promise<JWT> {
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
      repo: repository,
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

    if (!Array.isArray(file.data)) {
      if (file.data.type === 'file') {
        const { content, sha, name } = file.data
        const parsedContent =
          content && Buffer.from(content, 'base64').toString('utf-8')

        return { name, path, sha, content: parsedContent }
      }
    }
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
          },
        ]),
      ).values(),
    ]

    return contributors
  }
}
