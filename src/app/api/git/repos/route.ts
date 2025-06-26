import { getGitAdapter } from '@/services/git/GitAdapterFactory'
import { errorResponse, withAuth } from '@/lib/api-helpers'

export async function GET() {
  try {
    const session = await withAuth()
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    const userRepos = await gitAdapter.getUserRepos({
      accessToken: session.user.accessToken ?? '',
    })

    return Response.json({ code: 200, data: userRepos })
  } catch (error: any) {
    return errorResponse(
      error.status ?? 500,
      error.message ?? 'Something went wrong.',
    )
  }
}
