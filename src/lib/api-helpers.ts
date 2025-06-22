import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'

export const errorResponse = (code: number, message: string) =>
  Response.json({ code, message }, { status: code })

export async function withAuth() {
  const session = await auth()
  if (!session) throw { status: 401, message: 'Unauthorized, please sign in.' }
  return session
}

export function getParams(request: NextRequest, required: string[]) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries())
  const missing = required.filter((key) => !params[key])
  if (missing.length > 0) {
    throw {
      status: 400,
      message: `Bad request, missing parameters: ${missing.join(', ')}.`,
    }
  }
  return params
}
