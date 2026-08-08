import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSION, jetonSessionValide } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const jeton = request.cookies.get(COOKIE_SESSION)?.value;
    if (!(await jetonSessionValide(jeton))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
