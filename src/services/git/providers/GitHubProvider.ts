import {
  type GitAdapterDeleteFile,
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

    const file = await octokit.rest.repos.getContent({
      owner,
      repo: repository,
      path: path,
    })

    const content = file.data.content
    const sha = file.data.sha
    const parsedContent = Buffer.from(content, 'base64').toString('utf-8')

    return { sha, content: parsedContent }
  }
}
