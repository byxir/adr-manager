import type { JWT } from '@auth/core/jwt'

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

export interface GitAdapterDeleteFile extends GitAdapterMethodInterface {
  owner: string
  repository: string
  path: string
  sha: string
  message: string
}

export interface GitAdapterCreateOrUpdateFile
  extends GitAdapterMethodInterface {
  owner: string
  path: string
  repository: string
  message: string
  content: string
  branch: string
  sha: string
}

export interface GitAdapter {
  refreshAccessToken(token: JWT): Promise<unknown>

  getUserRepos(params: GitAdapterMethodInterface): Promise<unknown>

  getRepoTree(params: GitAdapterFetchTree): Promise<unknown>

  getFile(params: GitAdapterFetchFile): Promise<unknown>

  getFileContributors(params: GitAdapterFetchFile): Promise<unknown>

  createOrUpdateFile(params: GitAdapterCreateOrUpdateFile): Promise<unknown>

  deleteFile(params: GitAdapterDeleteFile): Promise<unknown>
}
