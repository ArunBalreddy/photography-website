import { NextResponse, type NextRequest } from "next/server";

// Fast path: no admin session cookie → straight to the sign-in page, before /admin renders.
// (The dashboard still fully verifies the cookie's signature.)
export function proxy(request: NextRequest) {
  if (!request.cookies.has("pq_admin")) return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: "/admin" };
