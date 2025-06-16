import {
  type GitAdapter,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { createOctokit } from '@/lib/git/Octokit'

export class GitHubProvider implements GitAdapter {
  getUserRepos(params: GitAdapterMethodInterface): Promise<any> {
    throw new Error('Method not implemented.')
  }
  getRepoTree(params: GitAdapterFetchTree): Promise<any> {
    throw new Error('Method not implemented.')
  }
  getFileContent(params: GitAdapterFetchFile): Promise<any> {
    throw new Error('Method not implemented.')
  }
  static async getUserRepos({ accessToken }: GitAdapterMethodInterface) {
    const octokit = createOctokit(accessToken)

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data
  }

  static async getRepoTree({
    accessToken,
    owner,
    repository,
    branch,
  }: GitAdapterFetchTree) {
    const octokit = createOctokit(accessToken)

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
    const octokit = createOctokit(accessToken)

    return (
      await octokit.rest.repos.getContent({
        mediaType: {
          format: 'raw',
        },
        owner,
        repo: repository,
        path: path,
      })
    )?.data
  }
}
