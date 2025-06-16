import {
  type GitAdapterFetchFile,
  type GitAdapterFetchTree,
  type GitAdapterMethodInterface,
} from './../GitAdapter'
import { Gitlab } from '@gitbeaker/rest'

export class GitLabProvider {
  private static getClient(token: string) {
    return new Gitlab({
      token: token,
    })
  }

  static async getUserRepos({
    accessToken,
  }: GitAdapterMethodInterface): Promise<any> {
    console.log(accessToken)

    const client = this.getClient(accessToken)
    return await client.Projects.all({})
  }

  static async getRepoTree({
    accessToken,
    repository,
    branch = 'main',
  }: GitAdapterFetchTree): Promise<any> {
    const client = this.getClient(accessToken)

    return await client.Repositories.tree(repository, {
      ref: branch,
      recursive: true,
    })
  }

  static async getFileContent({
    accessToken,
    repository,
    path,
    branch = 'main',
  }: GitAdapterFetchFile): Promise<any> {
    const client = this.getClient(accessToken)

    const file = await client.RepositoryFiles.show(repository, path, branch)

    return {
      content: Buffer.from(file.content, 'base64').toString('utf-8'),
      fileName: path,
    }
  }
}
