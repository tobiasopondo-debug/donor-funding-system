import { NextRequest, NextResponse } from "next/server";

const API = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await r.json()) as { accessToken?: string; refreshToken?: string; user?: unknown; message?: string };
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }
  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ message: "Invalid auth response" }, { status: 500 });
  }
  const { refreshToken } = data;
  const res = NextResponse.json({ accessToken: data.accessToken, user: data.user });
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
