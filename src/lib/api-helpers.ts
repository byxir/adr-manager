import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'

export const errorResponse = (code: number, message: string) =>
  Response.json({ code, message }, { status: code })

export async function withAuth() {
  const session = await auth()
  if (!session) throw { status: 401, message: 'Unauthorized, please sign in.' }
  return session
}

export function getParams<const T extends readonly string[]>(
  request: NextRequest,
  required: T,
): Record<T[number], string> {
  const params = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  ) as Record<string, string>

  const missing = required.filter((key) => !params[key])
  if (missing.length > 0) {
    throw {
      status: 400,
      message: `Bad request, missing parameters: ${missing.join(', ')}.`,
    }
  }

  return Object.fromEntries(
    required.map((key) => [key, params[key]!]),
  ) as Record<T[number], string>
}
