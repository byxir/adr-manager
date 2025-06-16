import {
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Octokit } from '@octokit/rest'

export class GitHubProvider {
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

  static async getFileContent({
    accessToken,
    owner,
    repository,
    path,
  }: GitAdapterFetchFile) {
    const octokit = this.createClient(accessToken)

    const result = (
      await octokit.rest.repos.getContent({
        mediaType: {
          format: 'raw',
        },
        owner,
        repo: repository,
        path: path,
      })
    )?.data

    const decoded = Buffer.from(result.data.content, 'base64').toString('utf-8')
    console.log(1, decoded)
    return decoded
  }
}
