import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ENTRY_PATHS = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // Only enforce cookie auth on dashboard routes (matches legacy middleware behavior).
  if (isDashboard && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isAuthEntry = AUTH_ENTRY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (token && isAuthEntry) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
