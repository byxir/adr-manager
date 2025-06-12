export interface GitAdapterMethodInterface {
  accessToken: string
}

export interface GitAdapterFetchTree extends GitAdapterMethodInterface {
  owner: string
  repository: string
  branch: string
}

export interface GitAdapterFetchFile extends GitAdapterMethodInterface {
  owner: string
  repository: string
  path: string
}

export interface GitAdapter {
  pushToRepo(params: {
    repoName: string
    branch: string
    content: string
    token: string
  }): Promise<void>

  getUserRepos(params: GitAdapterMethodInterface): Promise<unknown[]>

  getRepoTree(params: GitAdapterFetchTree): Promise<unknown[]>

  getFileContent(params: GitAdapterFetchFile): Promise<unknown[]>
}
