'use client'

import { useQuery } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { getRepos, getRepoTree } from '@/app/actions'
import { getAdrsByRepository } from '@/lib/adr-db-actions'
import type { ApiResponse, RepoTree } from '@/app/types'
import { useSession } from 'next-auth/react'

export function useRepos() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['repos'],
    queryFn: getRepos,
    enabled: !!session,
  })
}

export function useRepoTree(
  activeRepo: string | null,
  owner: string | null,
  branch: string | null,
) {
  const { data: session } = useSession()
  return useQuery<ApiResponse<RepoTree> | null>({
    queryKey: ['repoTree', activeRepo, owner, branch],
    queryFn: () => getRepoTree(activeRepo ?? '', branch ?? '', owner ?? ''),
    enabled:
      !!activeRepo &&
      !!owner &&
      !!branch &&
      typeof activeRepo === 'string' &&
      !!session,
  })
}

export function useRepoAdrs(activeRepo: string | null) {
  return useLiveQuery(() => {
    if (!activeRepo || typeof activeRepo !== 'string') return null
    return getAdrsByRepository(activeRepo)
  }, [activeRepo])
}
