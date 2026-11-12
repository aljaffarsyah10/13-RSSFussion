import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Anti-CSRF verification for state-changing API mutations
  const isApiMutation =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/callback") &&
    ["POST", "PATCH", "PUT", "DELETE"].includes(request.method);

  if (isApiMutation) {
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return NextResponse.json(
        { error: { code: "CSRF_DETECTED", message: "Cross-site request blocked" } },
        { status: 403 }
      );
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const expectedHost = host.toLowerCase();
        const originHost = originUrl.host.toLowerCase();

        if (originHost !== expectedHost) {
          return NextResponse.json(
            { error: { code: "CSRF_DETECTED", message: "Cross-site request origin mismatch" } },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: { code: "CSRF_DETECTED", message: "Invalid request origin" } },
          { status: 403 }
        );
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder.supabase.co")
  ) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getUser();
  }

  // 2. Comprehensive HTTP Security Headers
  const securityHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  };

  for (const [key, value] of Object.entries(securityHeaders)) {
    supabaseResponse.headers.set(key, value);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
