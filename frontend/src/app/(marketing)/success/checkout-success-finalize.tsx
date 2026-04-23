"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/api";

export function CheckoutSuccessFinalize({ sessionId }: { sessionId: string | undefined }) {
  const [message, setMessage] = useState("Confirming payment with the server…");

  useEffect(() => {
    if (!sessionId) {
      setMessage("No session id in the URL. If you paid, check your donor dashboard.");
      return;
    }
    const token = getToken();
    if (!token) {
      setMessage("Sign in, then open this page again so we can record your donation.");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch<{ ok: boolean; updated?: boolean; reason?: string }>(
          "/donations/checkout/verify-session",
          { method: "POST", body: JSON.stringify({ sessionId }) },
          token,
        );
        if (cancelled) return;
        if (!res.ok) {
          setMessage(res.reason === "not_paid" ? "Payment not completed yet." : "Could not confirm payment.");
          return;
        }
        setMessage(
          res.updated
            ? "Thank you — your donation is recorded and totals are updated."
            : "Thank you — your donation was already recorded (or the webhook ran first).",
        );
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : "Could not confirm payment");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return <p className="mt-4 text-sm text-muted-foreground">{message}</p>;
}
