
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",             
  "/auth/login_dokter",
  "/auth/regis",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) =>
      p === "/" ? pathname === "/" : pathname.startsWith(p)
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".");

  if (isPublic) return NextResponse.next();

  // Cek token dari cookie
  const token = request.cookies.get("token")?.value;

  if (!token) {
    // Belum login → redirect ke halaman login
    const loginUrl = new URL("/auth/login_dokter", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};