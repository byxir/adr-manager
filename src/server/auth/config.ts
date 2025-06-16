import { type DefaultSession, type NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import GitLab from 'next-auth/providers/gitlab'

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
  providers: [
    GitHub({
      ...(gitHubUrl && {
        issuer: gitHubUrl,
      }),
      authorization: {
        params: {
          scope: 'read:user repo',
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
        return {
          ...token,
          access_token: account.access_token,
          authorized_provider: account.provider,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        }
      }
      return token
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
