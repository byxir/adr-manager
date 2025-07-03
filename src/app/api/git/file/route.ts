import { getGitAdapter } from '@/services/git/GitAdapterFactory'
import { type NextRequest } from 'next/server'
import { errorResponse, getParams, withAuth } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth()
    const { repo, path, owner } = getParams(request, [
      'repo',
      'path',
      'owner',
    ] as const)
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    const accessToken = session.user.accessToken
    const file = await gitAdapter.getFile({
      accessToken,
      owner,
      repository: repo,
      path,
    })

    const contributors = await gitAdapter.getFileContributors({
      accessToken,
      owner,
      repository: repo,
      path,
    })

    return Response.json({ code: 200, data: file, contributors })
  } catch (error: any) {
    console.error(error)
    return errorResponse(
      error.status ?? 500,
      error.message ?? 'Something went wrong.',
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await withAuth()
    const { repo, path, branch, owner, sha } = getParams(request, [
      'repo',
      'path',
      'branch',
      'owner',
      'sha',
    ] as const)
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    await gitAdapter.deleteFile({
      accessToken: session.user.accessToken ?? '',
      owner,
      repository: repo,
      branch,
      path,
      sha,
      message: 'ADR Deleted',
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

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth()
    const { repo, path, owner, sha, branch } = getParams(request, [
      'repo',
      'path',
      'owner',
      'branch',
    ] as const)

    const sha = request.nextUrl.searchParams.get('sha')

    console.log('POST', {
      repo,
      path,
      owner,
      sha,
      branch,
    })
    const gitAdapter = getGitAdapter(session.user.authorizedProvider)

    const content = await request.text()

    await gitAdapter.createOrUpdateFile({
      accessToken: session.user.accessToken ?? '',
      owner,
      repository: repo,
      path,
      content,
      sha,
      branch,
      message: 'ADR Updated',
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
