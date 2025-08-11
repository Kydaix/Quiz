// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions: NextAuthOptions = {
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: [
                        'user-top-read',
                        'streaming',
                        'user-read-email',
                        'user-read-private',
                        'user-modify-playback-state',
                        'user-read-playback-state',
                        'user-read-currently-playing',
                    ].join(' ')
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account?.access_token) token.accessToken = account.access_token;
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string | undefined;
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
        signOut: "/logout",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
