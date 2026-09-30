import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import api from "@/lib/api"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string
    role: string
    accessToken: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
      accessToken: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string
    role: string
    accessToken: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        try {
          const response = await api.post("/auth/login", {
            email: credentials.email,
            password: credentials.password,
          })
          const user = response.data.user || response.data
          if (user && user.accessToken) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              accessToken: user.accessToken,
            }
          }
          return null
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.email = token.email
      session.user.name = token.name
      session.user.role = token.role
      session.user.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
