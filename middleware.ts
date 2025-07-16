import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/"];
const allowedRoutes   = [
  "/api/auth/", "/auth/", "/login", "/_next/", "/manifest.json",
  "/favicon.ico", "/api/edge/backend.listCapabilities"
];

// File extensions that should bypass authentication
const publicFileExtensions = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.css', '.js'
];

export default async function middleware(request: NextRequest) {
  /* ① One-time purge of the legacy idToken cookie */
  const response = NextResponse.next();
  if (request.cookies.has("idToken")) {
    response.cookies.set({
      name: "idToken",
      value: "",
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  }

  /* ② Your routing / auth logic */
  const pathname = request.nextUrl.pathname;

  if (publicFileExtensions.some(ext => pathname.endsWith(ext))) {
    return response;
  }

  if (allowedRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ req: request });
    if (!token) {
      const signInUrl = new URL("/api/auth/signin/azure-ad", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

/*
  After a week or two, once you’re sure all browsers
  have dropped the old idToken cookie, you can delete
  the purge block at the top—
  but leave publicFileExtensions in place.
*/