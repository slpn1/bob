import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { cookies } from 'next/headers'

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
    pages: {
        signIn: "/login",
    }
};



const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
