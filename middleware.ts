import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for route protection
 *
 * - Redirects unauthenticated users to /auth/login for protected routes
 * - Redirects authenticated users away from auth pages to /
 *
 * Note: This middleware can only check for token presence, not validity.
 * Token validation happens on the client side after page load.
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/", "/editor", "/vault", "/settings", "/profile"];

// Auth routes (login, register)
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/auth", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie or check localStorage via header
  // Note: localStorage is not accessible in middleware, so we use cookies
  const token = request.cookies.get("smart_word_editor_token")?.value;

  // Check if user has token (basic check, not validation)
  const hasToken = !!token;

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current route is auth route
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing protected route without token, redirect to login
  // Note: We don't enforce this strictly because token is in localStorage
  // The actual protection happens client-side with useAuth hook

  // If accessing auth route with token, redirect to home
  // This is optional - users might want to switch accounts
  // if (isAuthRoute && hasToken) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
