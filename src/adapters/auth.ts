import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/db/client";

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  }
}

/** App login. Integrations (Slack, Gmail, ...) are connected separately via their own OAuth. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on sign-in: map the provider identity to our User row.
      if (user?.email) {
        const record = await db.user.upsert({
          where: { email: user.email },
          update: { name: user.name },
          create: { email: user.email, name: user.name },
        });
        token.userId = record.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      return session;
    },
  },
});

/** The signed-in user's id, or undefined for visitors. */
export async function getCurrentUserId(): Promise<string | undefined> {
  const session = await auth();
  return session?.user?.id;
}
