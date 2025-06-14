import { Octokit } from '@octokit/rest'

export function createOctokit(token: string) {
  const enterpriseBase = process.env.NEXT_PUBLIC_GITHUB_ENTERPRISE_URL

  const baseUrl = enterpriseBase
    ? `${enterpriseBase.replace(/\/$/, '')}/api/v3`
    : 'https://api.github.com'

  return new Octokit({
    auth: token,
    baseUrl,
  })
}
