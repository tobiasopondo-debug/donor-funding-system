import { NextResponse, type NextRequest } from "next/server";

const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Whether the refresh-token cookie should be marked Secure.
 * `NODE_ENV === "production"` alone is wrong for Docker/local HTTP: the Next
 * runner is often production while users still hit http://localhost — Secure
 * cookies then break auth. Prefer TLS signal from the request, or COOKIE_SECURE.
 */
export function cookieSecureFlag(req: Pick<NextRequest, "headers" | "nextUrl">): boolean {
  const e = process.env.COOKIE_SECURE?.toLowerCase();
  if (e === "true" || e === "1") return true;
  if (e === "false" || e === "0") return false;
  const xf = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (xf === "https") return true;
  if (xf === "http") return false;
  return req.nextUrl.protocol === "https:";
}

export function setRefreshTokenCookie(
  res: NextResponse,
  refreshToken: string,
  req: Pick<NextRequest, "headers" | "nextUrl">,
) {
  const secure = cookieSecureFlag(req);
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: REFRESH_MAX_AGE,
    secure,
  });
}

export function jsonWithRefreshCookie(
  body: Record<string, unknown>,
  refreshToken: string,
  req: Pick<NextRequest, "headers" | "nextUrl">,
  init?: { status?: number },
) {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  try {
    setRefreshTokenCookie(res, refreshToken, req);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { message: "Could not set session cookie", detail },
      { status: 500 },
    );
  }
  return res;
}
