import { auth } from '@/server/auth'
import { getGitAdapter } from '@/services/git/GitAdapterFactory'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session) {
    const statusCode = 401
    return Response.json(
      {
        code: statusCode,
        message: 'Unauthorized, please sign in.',
      },
      {
        status: statusCode,
      },
    )
  }

  const provider = session.user.authorizedProvider
  const gitAdapter = getGitAdapter(provider)

  const searchParams = request.nextUrl.searchParams
  const repo = searchParams.get('repo')
  const branch = searchParams.get('branch')
  const owner = searchParams.get('owner')

  if (!branch || !owner) {
    const statusCode = 400
    return Response.json(
      {
        code: statusCode,
        message: 'Bad request, missing branch parameter.',
      },
      {
        status: statusCode,
      },
    )
  }

  const repoTree = await gitAdapter.getRepoTree({
    accessToken: session?.user?.accessToken ?? '',
    owner,
    repository: repo,
    branch: branch,
  })

  return Response.json({ code: 200, data: repoTree })
}
