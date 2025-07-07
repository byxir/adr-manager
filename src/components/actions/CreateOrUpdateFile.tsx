import { Button } from '@/components/ui/button'
import React from 'react'
import { useMutation, useIsFetching } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createOrUpdateFile } from '@/app/actions'

export default function UpdateOrCreateFileButton({
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
}) {
  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      console.log('createOrUpdateFile', {
        owner,
        repo: repo,
        branch,
        path,
        message: 'Create or update ADR',
      })
      return createOrUpdateFile({
        repo,
        path,
        owner,
        sha,
        branch,
        content,
      })
    },
    onSuccess: () =>
      toast.success('Successfully pushed changes.', {
        description: 'Your ADR changes have been pushed to the git repository.',
      }),
  })

  // Check for loading states of queries with specified names
  const isQueriesLoading =
    useIsFetching({
      predicate: (query) => {
        const queryKey = query.queryKey[0] as string
        return ['adr', 'file', 'repoTree', 'repos'].includes(queryKey)
      },
    }) > 0

  const isLoading = isPending || isQueriesLoading

  return (
    <Button
      onClick={() => mutate()}
      loading={isLoading}
      className="w-full text-xs h-8 updateOrCreateFile"
    >
      Push ADR
    </Button>
  )
}
