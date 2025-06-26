import { Button } from '@/components/ui/button'
import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { createOrUpdateFile } from '@/app/actions'

export default function UpdateOrCreateFileButton({}) {
  const { mutate, data, isLoading } = useMutation({
    mutationFn: () => createOrUpdateFile({}),
  })

  return (
    <Button onClick={mutate} loading={isLoading} className="w-full text-xs h-8">
      Push ADR
    </Button>
  )
}
