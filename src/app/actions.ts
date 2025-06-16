import type { Repo } from '@/app/types'

export function getRepos(): Promise<{
  code: number
  data: Repo[]
}> {
  return fetch('/api/git/repos').then((r) => r.json())
}

export function getRepoTree(
  repo: string,
  branch: string,
  owner: string,
): Promise<{
  code: number
  data: any
}> {
  return fetch(
    `/api/git/repo?repo=${repo}&branch=${branch}&owner=${owner}`,
  ).then((r) => r.json())
}

export function getFileContent(
  repo: string,
  path: string,
  owner: string,
): Promise<{
  code: number
  data: any
}> {
  return fetch(`/api/git/file?repo=${repo}&path=${path}&owner=${owner}`).then(
    (r) => r.json(),
  )
}
