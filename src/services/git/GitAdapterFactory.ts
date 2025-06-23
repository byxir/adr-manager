import { type GitAdapter } from './GitAdapter'
import { GitHubProvider } from '@/services/git/providers/GitHubProvider'
import { GitLabProvider } from '@/services/git/providers/GitLabProvider'

export function getGitAdapter(provider: string): GitAdapter {
  switch (provider) {
    case 'github':
      return GitHubProvider
    case 'gitlab':
      return GitLabProvider
    default:
      throw new Error(`Unsupported Git provider: ${provider}`)
  }
}
