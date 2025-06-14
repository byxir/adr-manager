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
  getUserRepos(params: GitAdapterMethodInterface): Promise<any>

  getRepoTree(params: GitAdapterFetchTree): Promise<any>

  getFileContent(params: GitAdapterFetchFile): Promise<any>
}
