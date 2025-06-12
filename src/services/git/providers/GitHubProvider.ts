import {
  type GitAdapter,
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Octokit } from 'octokit'

export class GitHubProvider implements GitAdapter {
  static async getUserRepos({ accessToken }: GitAdapterMethodInterface) {
    const octokit = new Octokit({ auth: accessToken })

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data
  }

  static async getRepoTree({
    accessToken,
    owner,
    repository,
    branch,
  }: GitAdapterFetchTree) {
    const octokit = new Octokit({ auth: accessToken })

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
    const octokit = new Octokit({ auth: accessToken })

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
