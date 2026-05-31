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
     *  - Static asset paths (_next/static, _next/image)
     *  - Favicon
     *  - Public image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
