import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// API Paths to be restricted.
const protectedRoutes = ["/"];
const allowedRoutes = ["/api/auth/", "/auth/", "/login", "/api/auth/", "/_next/", "/manifest.json", "/favicon.ico", "/api/edge/backend.listCapabilities"];

// File extensions that should bypass authentication
const publicFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.css', '.js'];

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    // Check if the request is for a public file
    if (publicFileExtensions.some(ext => pathname.endsWith(ext))) {
        return NextResponse.next();
    }

    // Check if the pathname matches any of the allowed routes
    for (const route of allowedRoutes) {
        if (pathname.startsWith(route)) {
            return NextResponse.next();
        }
    }

    // Check if the current route is a protected route
    if (protectedRoutes.some((path) => pathname.startsWith(path))) {
        const token = await getToken({ req: request });

        // If no token, redirect to the sign-in page
        if (!token) {
            const signInUrl = new URL("/api/auth/signin/azure-ad", request.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    // Allow the request to proceed
    return NextResponse.next();
}
