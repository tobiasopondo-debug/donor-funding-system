import { NextRequest, NextResponse } from "next/server";
import { cookieSecureFlag } from "../refresh-cookie";

const API = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  try {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { Authorization: auth ?? "", cookie: req.headers.get("cookie") ?? "" },
    });
  } catch {
    /* ignore */
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    secure: cookieSecureFlag(req),
  });
  return res;
}
