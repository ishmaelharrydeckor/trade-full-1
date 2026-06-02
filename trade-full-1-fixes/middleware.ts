// middleware.ts
// Next.js middleware — runs on every request matching the matcher below.
// Refreshes Supabase auth cookies and enforces route protection.

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every request EXCEPT:
     * - Static asset paths (_next/static, _next/image)
     * - Favicon
     * - Public image extensions
     *
     * NOTE: The negative-lookahead group below requires at least one char
     * after the leading slash, so "/" alone is NOT matched by that pattern.
     * We add "/" explicitly as a second entry to ensure the root path also
     * goes through updateSession (cookie refresh + auth guard).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/",
  ],
};
