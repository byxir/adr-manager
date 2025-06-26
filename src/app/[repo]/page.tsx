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
import { getAdrByNameAndRepository } from '@/lib/adr-db-actions'
import { RiFileTextLine } from '@remixicon/react'

const RepoPage = () => {
  const { repo } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const owner = searchParams.get('owner')
  const branch = searchParams.get('branch')

  const activeRepo = repo as string
  const adrs = useRepoAdrs(activeRepo)
  const { data: repoTree } = useRepoTree(activeRepo, owner, branch)

  // Function to handle file clicks using the same logic as app-sidebar
  const handleFileClick = async (filePath: string, fileName: string) => {
    if (!activeRepo) return

    // Check if this file is an ADR in the database
    const adr = await getAdrByNameAndRepository(fileName, activeRepo)

    if (adr && !adr.hasMatch) {
      // Redirect to ADR page
      router.push(`/${activeRepo}/adr/${fileName}`)
    } else {
      // Navigate to regular file page
      router.push(
        `/${activeRepo}/file/${filePath.replaceAll('/', '~')}?owner=${owner}`,
      )
    }
  }

  // Filter and process files from repo tree
  const files =
    repoTree?.data?.tree?.filter((item) => item.type === 'blob') ?? []

  // Separate root level files (not in subdirectories)
  const rootFiles = files.filter((file) => !file.path.includes('/'))

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{activeRepo}</h1>
        <p className="text-muted-foreground">
          Quick access to architecture decision records
        </p>
      </div>

      {/* ADRs Section */}
      {adrs && adrs.length > 0 && (
        <div className="space-y-4">
          {/* <h2 className="text-2xl font-semibold">
            Architecture Decision Records
          </h2> */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {adrs
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              )
              .map((adr) => (
                <Card
                  key={adr.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/${activeRepo}/adr/${adr.name}`)}
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
                      ADR • {adr.path}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {/* {rootFiles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Repository Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rootFiles.map((file) => {
              const fileName = file.path.split('/').pop() ?? file.path
              const extension = getFileExtension(fileName)

              return (
                <Card
                  key={file.path}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleFileClick(file.path, fileName)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getFileIcon(extension, 'size-4 text-muted-foreground')}
                      <CardTitle className="text-sm font-medium truncate">
                        {fileName}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      File •{' '}
                      {file.size
                        ? `${Math.round(file.size / 1024)}KB`
                        : 'Unknown size'}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )} */}

      {/* Directories Section */}
      {/* {(repoTree?.data?.tree?.filter((item) => item.type === 'tree').length ??
        0) > 0 &&
        repoTree?.data?.tree && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Directories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {repoTree.data.tree
                .filter((item) => item.type === 'tree')
                .map((directory) => (
                  <Card
                    key={directory.path}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <RiFolderLine className="size-4 text-yellow-600" />
                        <CardTitle className="text-sm font-medium truncate">
                          {directory.path}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        Directory
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

      {(!adrs || adrs.length === 0) && rootFiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No ADRs or files found in this repository.
          </p>
        </div>
      )} */}
    </div>
  )
}

export default RepoPage
