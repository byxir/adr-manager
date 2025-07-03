import axios from 'axios'
import type { Repo } from '@/definitions/types'

export function getRepos(): Promise<{
  code: number
  data: Repo[]
}> {
  return axios.get('/api/git/repos').then((res) => res.data)
}

export function createOrUpdateFile({
  repo,
  path,
  owner,
  sha,
  branch,
  content,
}: {
  repo: string
  path: string
  owner: string
  sha: string
  branch: string
  content: string
}): Promise<{ code: number }> {
  console.log('createOrUpdateFile', {
    repo,
    path,
    owner,
    sha,
    branch,
  })
  return axios.post('/api/git/file', {
    params: { repo, path, owner, sha, branch },
    body: content,
  })
}

export function getRepoTree(
  repo: string,
  branch: string,
  owner: string,
): Promise<{
  code: number
  data: any
}> {
  return axios
    .get('/api/git/repo', {
      params: { repo, branch, owner },
    })
    .then((res) => res.data)
}

export function getFileContent(
  repo: string,
  path: string,
  owner: string,
): Promise<{
  code: number
  data: any
}> {
  return axios
    .get('/api/git/file', {
      params: { repo, path, owner },
    })
    .then((res) => res.data)
}
