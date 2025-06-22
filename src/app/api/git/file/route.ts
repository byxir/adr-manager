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
  const repo = searchParams.get('repo')!

  const filePath = searchParams.get('path')!
  const owner = searchParams.get('owner')!

  if (!filePath || !owner || !repo) {
    const statusCode = 400
    return Response.json(
      {
        code: statusCode,
        message:
          'Bad request, missing one of the following parameters: path, owner or repo.',
      },
      {
        status: statusCode,
      },
    )
  }

  const file = await gitAdapter.getFile({
    accessToken: session?.user?.accessToken ?? '',
    owner,
    repository: repo,
    path: filePath,
  })

  return Response.json({ code: 200, data: file })
}

export async function DELETE(request: NextRequest) {
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
  const repo = searchParams.get('repo')!
  const filePath = searchParams.get('path')!
  const owner = searchParams.get('owner')!
  const sha = searchParams.get('sha')!

  if (!filePath || !owner || !sha || !repo) {
    const statusCode = 400
    return Response.json(
      {
        code: statusCode,
        message:
          'Bad request, missing one of the following parameters: path, owner, repo or sha.',
      },
      {
        status: statusCode,
      },
    )
  }

  const accessToken = session?.user?.accessToken ?? ''

  try {
    await gitAdapter.deleteFile({
      accessToken,
      owner,
      repository: repo,
      path: filePath,
      sha,
      message: 'ADR Deleted',
    })
  } catch (error: unknown) {
    const statusCode = 500
    const message =
      error instanceof Error ? error.message : 'Something went wrong.'
    return Response.json(
      {
        code: statusCode,
        message,
      },
      {
        status: statusCode,
      },
    )
  }

  return Response.json({ code: 200 })
}

export async function POST(request: NextRequest) {
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
  const repo = searchParams.get('repo')!
  const branch = searchParams.get('branch')!
  const filePath = searchParams.get('path')!
  const owner = searchParams.get('owner')!
  const sha = searchParams.get('sha')!

  if (!filePath || !owner || !sha || !repo || !branch) {
    const statusCode = 400
    return Response.json(
      {
        code: statusCode,
        message:
          'Bad request, missing one of the following parameters: repo, branch, path, owner, repo or sha.',
      },
      {
        status: statusCode,
      },
    )
  }

  const accessToken = session?.user?.accessToken ?? ''

  try {
    await gitAdapter.createOrUpdateFile({
      accessToken,
      owner,
      repository: repo,
      branch,
      path: filePath,
      sha,
      message: 'ADR Deleted',
    })
  } catch (error: unknown) {
    const statusCode = 500
    const message =
      error instanceof Error ? error.message : 'Something went wrong.'
    return Response.json(
      {
        code: statusCode,
        message,
      },
      {
        status: statusCode,
      },
    )
  }

  return Response.json({ code: 200 })
}
