import { type DefaultSession, type NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GitLab from 'next-auth/providers/gitlab'
import { getGitAdapter } from '@/services/git/GitAdapterFactory'

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      accessToken: string
      authorizedProvider: string
      gitUsername: string
    } & DefaultSession['user']
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */

const gitHubUrl = process.env.GITHUB_ENTERPRISE_URL ?? undefined
const gitLabUrl = process.env.GITLAB_URL ?? undefined
const GITLAB_AUTH_URL = 'https://gitlab.com/oauth/authorize'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    GitHub({
      ...(gitHubUrl && {
        issuer: gitHubUrl,
      }),
      authorization: {
        params: {
          scope: 'read:user repo',
          prompt: 'consent',
        },
      },
    }),
    GitLab({
      authorization: {
        url: GITLAB_AUTH_URL,
        params: {
          scope: 'read_user api write_repository',
        },
      },
      ...(gitLabUrl && {
        issuer: gitLabUrl,
      }),
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // First-time login, save the `access_token`, its expiry and the `refresh_token`
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
          authorized_provider: account.provider,
        }
      } else if (
        Date.now() < token.expires_at * 1000 ||
        token.expires_at === undefined
      ) {
        // Subsequent logins, but the `access_token` is still valid or if expires_at is undefined, meaning the app does not allow for refresh tokens.
        return token
      } else {
        // Subsequent logins, but the `access_token` has expired, try to refresh it
        if (!token.refresh_token) throw new TypeError('Missing refresh_token')

        try {
          const provider = getGitAdapter(token.authorized_provider)

          const newToken = provider.refreshAccessToken(token)

          return newToken
        } catch (error) {
          console.error('Error refreshing access_token', error)
          // If we fail to refresh the token, return an error so we can handle it on the page
          return token
        }
      }
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        accessToken: token.access_token,
        authorizedProvider: token.authorized_provider,
      },
    }),
  },
} satisfies NextAuthConfig
