import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // On demande le scope Sheets + Drive en plus du profil
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',   // Force le refresh_token à chaque fois
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // Stocker les tokens Google dans Supabase à la connexion
    async signIn({ user, account }) {
      if (account?.provider === 'google' && account.refresh_token) {
        await supabaseAdmin.from('settings').upsert([
          { key: 'google_access_token',  value: account.access_token  ?? '' },
          { key: 'google_refresh_token', value: account.refresh_token ?? '' },
          { key: 'google_token_expiry',  value: String(account.expires_at ?? 0) },
          { key: 'google_connected',     value: 'true' },
          { key: 'google_email',         value: user?.email ?? '' },
        ], { onConflict: 'key' })
      }
      return true
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken  = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt    = account.expires_at
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken  = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      return session
    },
  },

  pages: {
    signIn: '/settings',   // Redirige vers settings si non connecté
  },
}
