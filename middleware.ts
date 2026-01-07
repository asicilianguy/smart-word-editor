import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CompilaloEasy - Middleware
 *
 * Logica di accesso:
 * - "/" (landing) → tutti
 * - "/editor" → tutti (con/senza auth)
 * - "/vault" → solo autenticati
 * - "/auth/*" → tutti
 */

// Routes che richiedono autenticazione
const PROTECTED_ROUTES = ["/vault"];

// Auth routes
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get("smart_word_editor_token")?.value;
  const hasToken = !!token;

  // Check if current route is protected (only /vault)
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route is auth route
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !hasToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth route with token, redirect to editor
  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL("/editor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)"],
};
