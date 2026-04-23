import { NextRequest, NextResponse } from "next/server";
import { readUpstreamJson } from "../../upstream";

const API = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  let r: Response;
  try {
    r = await fetch(`${API}/auth/otp/resend`, {
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
  const parsed = await readUpstreamJson<{ ok?: boolean; message?: string }>(r);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: parsed.status });
  }
  return NextResponse.json(parsed.data, { status: r.status });
}
