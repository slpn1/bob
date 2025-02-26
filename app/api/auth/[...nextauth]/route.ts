import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { cookies } from 'next/headers'

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        idToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        provider?: string;
        accessToken?: string;
        idToken?: string;
    }
}


export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_CLIENT_ID as string,
            clientSecret: process.env.AZURE_CLIENT_SECRET as string,
            tenantId: process.env.AZURE_TENANT_ID as string,
            authorization: { params: { scope: "openid profile user.Read email" } },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET as string,
    callbacks: {
        async jwt({ token, account}) {
            if (account) {
                token.idToken = account.id_token as string;
                token.accessToken = account.access_token as string;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.idToken = token.idToken as string;
            (await cookies()).set('idToken', session.idToken);
            return session;
        },
    },
    pages: {
        signIn: "/login",
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
