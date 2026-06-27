import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth/login_dokter",
  "/auth/regis",
  "/auth/forgot-password",
  "/auth/reset-password",

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

  const token = request.cookies.get("token")?.value;
  const role  = request.cookies.get("role")?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login_dokter", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // user hanya boleh /owner_pet
  if (role === "user" && !pathname.startsWith("/owner_pet")) {
    return NextResponse.redirect(new URL("/auth/login_dokter", request.url));
  }

  // dokter hanya boleh /dokter
  if (role === "dokter" && !pathname.startsWith("/dokter")) {
    return NextResponse.redirect(new URL("/auth/login_dokter", request.url));
  }

  // admin hanya boleh /admin
  if (role === "admin" && !pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/auth/login_dokter", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};