import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/"];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // Only enforce cookie auth on dashboard routes to avoid server-side flicker on other pages.
  if (isDashboard && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (token && (pathname === "/login" || pathname === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
