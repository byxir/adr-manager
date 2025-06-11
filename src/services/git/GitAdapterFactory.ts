import { type GitAdapter } from './GitAdapter'
import { GitHubProvider } from '@/services/git/providers/GitHubProvider'

export function getGitAdapter(provider: string): GitAdapter {
  switch (provider) {
    case 'github':
      return GitHubProvider
    default:
      throw new Error(`Unsupported Git provider: ${provider}`)
  }
}
