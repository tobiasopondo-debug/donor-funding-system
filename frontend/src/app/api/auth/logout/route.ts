import { NextRequest, NextResponse } from "next/server";

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
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  return res;
}
