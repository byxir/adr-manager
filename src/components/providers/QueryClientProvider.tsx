'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { toast } from 'sonner'

const onErrorHandler = (error: any) => {
  toast.error('Error Occurred', {
    description:
      error.response?.data?.message ?? error.message ?? 'Something happened...',
    duration: 5000,
  })
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: onErrorHandler,
        }),
        queryCache: new QueryCache({
          onError: onErrorHandler,
        }),
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 120 * 1000,
            gcTime: 120 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
