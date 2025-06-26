import { Button } from '@/components/ui/button'
import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { createOrUpdateFile } from '@/app/actions'
import { toast } from 'sonner'

export default function UpdateOrCreateFileButton({}) {
  const { mutate, isPending } = useMutation({
    mutationFn: () => createOrUpdateFile({}),
    onSuccess: () =>
      toast.success('Successfully pushed changes.', {
        description: 'Your ADR changes have been pushed to the git repository.',
      }),
  })

  return (
    <Button onClick={mutate} loading={isPending} className="w-full text-xs h-8">
      Push ADR
    </Button>
  )
}
