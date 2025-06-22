import axios from 'axios'
import type { Repo } from '@/app/types'

export function getRepos(): Promise<{
  code: number
  data: Repo[]
}> {
  return axios.get('/api/git/repos').then((res) => res.data)
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
