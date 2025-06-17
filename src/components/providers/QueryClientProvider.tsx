'use client'

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { toast } from 'sonner'

const onErrorHandler = (error: Error) => {
  toast.error('Error Occurred', {
    description: error.message || 'Something happened...',
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
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 120 * 1000,
            gcTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
