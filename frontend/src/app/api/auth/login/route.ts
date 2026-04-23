import { NextRequest, NextResponse } from "next/server";
import { agentDebugAppend } from "../agent-debug-append";
import { jsonWithRefreshCookie } from "../refresh-cookie";
import { readUpstreamJson } from "../upstream";

const API = process.env.INTERNAL_API_URL ?? "http://localhost:4000";

type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
  requiresOtp?: boolean;
  challengeId?: string;
  purpose?: "REGISTER" | "LOGIN";
  message?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let r: Response;
    try {
      r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      agentDebugAppend({
        location: "login/route.ts:fetch",
        message: "Upstream fetch threw",
        detail: e instanceof Error ? e.message : String(e),
        apiHost: (() => {
          try {
            return new URL(API).host;
          } catch {
            return "invalid-url";
          }
        })(),
      });
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
      agentDebugAppend({
        location: "login/route.ts:upstream-error",
        message: "Upstream returned non-OK",
        upstreamStatus: r.status,
        keys: typeof data === "object" && data ? Object.keys(data as object) : [],
      });
      return NextResponse.json(data, { status: r.status });
    }
    if (data.requiresOtp && data.challengeId) {
      return NextResponse.json({
        requiresOtp: true,
        challengeId: data.challengeId,
        purpose: data.purpose ?? "LOGIN",
      });
    }
    if (!data.accessToken || !data.refreshToken) {
      agentDebugAppend({
        location: "login/route.ts:invalid-shape",
        message: "Invalid auth response branch",
        keys: typeof data === "object" && data ? Object.keys(data as object) : [],
        requiresOtp: data.requiresOtp,
        hasChallengeId: Boolean(data.challengeId),
      });
      return NextResponse.json({ message: "Invalid auth response" }, { status: 500 });
    }
    const { refreshToken, accessToken, user } = data;
    return jsonWithRefreshCookie({ accessToken, user }, refreshToken, req);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    agentDebugAppend({
      location: "login/route.ts:POST:catch",
      message: "Unhandled login BFF error",
      detail,
    });
    return NextResponse.json(
      {
        message: "Login failed",
        detail: process.env.AUTH_DEBUG_ERRORS === "1" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
