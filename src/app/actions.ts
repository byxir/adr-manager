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
  return axios.post(
    '/api/git/file',
    {
      body: content,
    },
    {
      params: { repo, path, owner, sha, branch },
    },
  )
}

export function deleteFile({
  repo,
  path,
  owner,
  sha,
  branch,
}: {
  repo: string
  path: string
  owner: string
  sha: string
  branch: string
}): Promise<{ code: number }> {
  return axios.delete('/api/git/file', {
    params: { repo, path, owner, sha, branch },
  })
}

export function moveFile({
  repo,
  oldPath,
  newPath,
  owner,
  sha,
  branch,
  content,
}: {
  repo: string
  oldPath: string
  newPath: string
  owner: string
  sha: string
  branch: string
  content: string
}): Promise<{ code: number }> {
  // Moving a file is done by creating the new file and deleting the old one
  return axios.post(
    '/api/git/file/move',
    {
      body: content,
    },
    {
      params: { repo, oldPath, newPath, owner, sha, branch },
    },
  )
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
