import { getGitAdapter } from '@/services/git/GitAdapterFactory'
import { type NextRequest } from 'next/server'
import { errorResponse, getParams, withAuth } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth()
    const { repo, oldPath, newPath, owner, branch } = getParams(request, [
      'repo',
      'oldPath',
      'newPath',
      'owner',
      'branch',
    ] as const)

    const sha = request.nextUrl.searchParams.get('sha')
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    const content = await request.text()
    const parsedContent = JSON.parse(content).body

    // Create the new file
    await gitAdapter.createOrUpdateFile({
      accessToken: session.user.accessToken ?? '',
      owner,
      repository: repo,
      path: newPath,
      content: parsedContent,
      branch,
      sha: null, // Creating new file, so no SHA needed
      message: 'Move file',
    })

    // Delete the old file
    await gitAdapter.deleteFile({
      accessToken: session.user.accessToken ?? '',
      owner,
      repository: repo,
      branch,
      path: oldPath,
      sha: sha ?? '',
      message: 'Move file - delete old location',
    })

    return Response.json({ code: 200 })
  } catch (error: any) {
    console.error(error)
    return errorResponse(
      error.status ?? 500,
      error.message ?? 'Something went wrong.',
    )
  }
}
