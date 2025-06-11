export interface GitAdapterMethodInterface {
  accessToken: string
}

export interface GitAdapterFetchRepoContent extends GitAdapterMethodInterface {
  username: string
  repository: string
  branch: string
}
export interface GitAdapter {
  pushToRepo(params: {
    repoName: string
    branch: string
    content: string
    token: string
  }): Promise<void>

  fetchUserRepos(params: GitAdapterMethodInterface): Promise<unknown[]>

  fetchRepoContent(params: GitAdapterFetchRepoContent): Promise<unknown[]>
}
