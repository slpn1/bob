import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// …your existing arrays…

export default async function middleware(request: NextRequest) {
  /* ──────────────────────────────────────────────────────────
     ①  Delete the legacy `idToken` cookie, if it’s present
     ────────────────────────────────────────────────────────── */
  const needsIdTokenPurge = request.cookies.has("idToken");
  // Prepare a response early so we can attach cookies to it:
  const response = NextResponse.next();

  if (needsIdTokenPurge) {
    response.cookies.set({
      name: "idToken",
      value: "",
      path: "/",          // must match the original cookie
      maxAge: 0,          // delete immediately
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     ②  Your existing auth / routing logic
     ────────────────────────────────────────────────────────── */
  const pathname = request.nextUrl.pathname;

  // Static assets → always allow
  if (publicFileExtensions.some(ext => pathname.endsWith(ext))) {
    return response;            // <- use the prepared response
  }

  // Whitelisted routes → always allow
  for (const route of allowedRoutes) {
    if (pathname.startsWith(route)) {
      return response;
    }
  }

  // Protected routes → require session
  if (protectedRoutes.some((path) => pathname.startsWith(path))) {
    const token = await getToken({ req: request });

    if (!token) {
      const signInUrl = new URL("/api/auth/signin/azure-ad", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Default: let the request proceed
  return response;
}