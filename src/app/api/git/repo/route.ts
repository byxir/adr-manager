import { getGitAdapter } from '@/services/git/GitAdapterFactory'
import { type NextRequest } from 'next/server'
import { errorResponse, getParams, withAuth } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth()
    const { repo, branch, owner } = getParams(request, [
      'repo',
      'branch',
      'owner',
    ] as const)
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    const repoTree = await gitAdapter.getRepoTree({
      accessToken: session.user.accessToken ?? '',
      owner,
      repository: repo,
      branch,
    })

    return Response.json({ code: 200, data: repoTree })
  } catch (error: any) {
    return errorResponse(
      error.status ?? 500,
      error.message ?? 'Something went wrong.',
    )
  }
}
