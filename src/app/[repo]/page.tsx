'use client'

import React from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useRepoAdrs, useRepoTree } from '@/hooks/use-repo-queries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RiFileTextLine } from '@remixicon/react'
import { v4 as uuidv4 } from 'uuid'

const RepoPage = () => {
  const { repo } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  const activeRepo = repo as string
  const adrs = useRepoAdrs(activeRepo)
  const { data: repoTree } = useRepoTree(activeRepo, owner, branch)

  // Get markdown files from repository tree
  const markdownFiles =
    repoTree?.data?.tree?.filter(
      (item) => item.type === 'blob' && item.path?.endsWith('.md'),
    ) ?? []

  // Combine database ADRs with markdown files from tree
  const allAdrs = React.useMemo(() => {
    const combined = []

    // Add database ADRs
    if (adrs && adrs.length > 0) {
      combined.push(
        ...adrs.map((adr) => ({
          ...adr,
          source: 'database' as const,
        })),
      )
    }

    // Add markdown files from tree (excluding duplicates)
    markdownFiles.forEach((file) => {
      const fileName = file.path?.split('/').pop() ?? file.path ?? ''
      const isAlreadyInDb = adrs?.some((adr) => adr.name === fileName)

      if (!isAlreadyInDb) {
        combined.push({
          name: fileName,
          path: file.path ?? '',
          createdAt: new Date().toISOString(), // Default timestamp for tree files
          source: 'tree' as const,
        })
      }
    })

    return combined
  }, [adrs, markdownFiles])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{activeRepo}</h1>
        <p className="text-muted-foreground">
          Quick access to architecture decision records
        </p>
      </div>

      {/* ADRs Section */}
      {allAdrs && allAdrs.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allAdrs
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              )
              .map((adr) => (
                <Card
                  key={uuidv4()}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    router.push(
                      `/${activeRepo}/adr/${adr.path.replaceAll('/', '~')}?owner=${owner}&branch=${branch}`,
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <RiFileTextLine className="size-4 text-blue-600" />
                      <CardTitle className="text-sm font-medium truncate">
                        {adr.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {adr.source === 'database' ? 'ADR' : 'MD'} • {adr.path}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
      {adrs?.length === 0 && markdownFiles?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No ADRs or markdown files found in this repository.
          </p>
        </div>
      )}
    </div>
  )
}

export default RepoPage
