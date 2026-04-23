const getPublicApi = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export { getPublicApi as getApiBase };

/** Server-only (RSC, Route Handlers). In Docker use INTERNAL_API_URL so fetches reach `api`, not `localhost` inside `web`. */
export function getServerApiBase(): string {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

/** Stripe-style minor units → display (KES: 100 minor = 1 KES). */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function formatKES(minorAmount: number, currency: string = "KES"): string {
  const code = (currency || "KES").toUpperCase();
  const useWholeUnits = ZERO_DECIMAL_CURRENCIES.has(code);
  const major = useWholeUnits ? minorAmount : minorAmount / 100;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: code,
    minimumFractionDigits: useWholeUnits ? 0 : 0,
    maximumFractionDigits: useWholeUnits ? 0 : 2,
  }).format(major);
}

/** Major display units → API minor units (KES: 1 shilling = 100 minor, i.e. 50000 KES → 5_000_000 minor). */
export function toAmountMinorFromMajor(major: number, currency: string): number {
  if (!Number.isFinite(major) || major < 0) return 0;
  const code = (currency || "KES").toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(major);
  return Math.round(major * 100);
}

/** API minor units → major for form inputs (inverse of {@link toAmountMinorFromMajor}). */
export function majorFromAmountMinor(minor: number, currency: string): number {
  const code = (currency || "KES").toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return minor;
  return minor / 100;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("access_token");
    return raw;
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) sessionStorage.setItem("access_token", token);
    else sessionStorage.removeItem("access_token");
  } catch {
    /* ignore */
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token: string | null = getToken()
): Promise<T> {
  const base = getPublicApi();
  const headers: HeadersInit = {
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  if (!("Content-Type" in (headers as object)) && init.body) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  const r = await fetch(`${base}${path}`, { ...init, headers, credentials: "omit" });
  if (r.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, init, refreshed);
    }
  }
  if (!r.ok) {
    const err = (await r.json().catch(() => ({}))) as { message?: string; statusCode?: number };
    throw new Error(err.message ?? r.statusText);
  }
  return r.json() as Promise<T>;
}

async function tryRefresh(): Promise<string | null> {
  const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (!r.ok) return null;
  const data = (await r.json()) as { accessToken: string; user: unknown };
  if (data.accessToken) {
    setToken(data.accessToken);
    const { useAuthStore } = await import("@/stores/auth-store");
    useAuthStore.getState().setSession(data.accessToken, data.user as never);
  }
  return data.accessToken ?? null;
}
