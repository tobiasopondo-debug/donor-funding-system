export type UpstreamResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

export async function readUpstreamJson<T>(r: Response): Promise<UpstreamResult<T>> {
  const text = await r.text();
  if (!text.trim()) {
    return {
      ok: false,
      status: r.status || 502,
      message:
        r.status >= 500
          ? "API returned an empty error. Check server logs."
          : "No response body from API. Is INTERNAL_API_URL correct (e.g. http://api:4000 in Docker)?",
    };
  }
  try {
    return { ok: true, status: r.status, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, message: "API returned non-JSON (is the backend URL wrong?)" };
  }
}
