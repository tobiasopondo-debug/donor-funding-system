import { NextRequest, NextResponse } from "next/server";
import { jsonWithRefreshCookie } from "../../refresh-cookie";
import { readUpstreamJson } from "../../upstream";

const API = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
  message?: string | string[];
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  let r: Response;
  try {
    r = await fetch(`${API}/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach API. Set INTERNAL_API_URL (e.g. http://api:4000 in Docker)." },
      { status: 502 },
    );
  }
  const parsed = await readUpstreamJson<AuthPayload>(r);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: parsed.status });
  }
  const data = parsed.data;
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }
  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ message: "Invalid auth response" }, { status: 500 });
  }
  const { refreshToken, accessToken, user } = data;
  return jsonWithRefreshCookie({ accessToken, user }, refreshToken, req);
}
