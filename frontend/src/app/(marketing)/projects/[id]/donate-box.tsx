"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";

export function DonateBox({ projectId, currency }: { projectId: string; currency: string }) {
  const [amount, setAmount] = useState("10000");
  const [phone, setPhone] = useState("");
  const [mpesaDonationId, setMpesaDonationId] = useState<string | null>(null);
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const isKes = currency.toUpperCase() === "KES";

  useEffect(() => {
    if (!mpesaDonationId || !user || user.role !== "DONOR") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const t = getToken();
        const res = await apiFetch<{ status?: string; mpesaReceiptNumber?: string | null }>(
          `/donations/mpesa/status/${mpesaDonationId}`,
          { method: "GET" },
          t
        );
        if (cancelled) return;
        if (res.status === "SUCCEEDED") {
          toast.success(res.mpesaReceiptNumber ? `Paid (${res.mpesaReceiptNumber})` : "Payment received");
          setMpesaDonationId(null);
          router.refresh();
        }
      } catch {
        /* keep polling */
      }
    };
    void poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [mpesaDonationId, user, router]);

  const donate = async () => {
    const minor = Math.round(parseFloat(amount));
    if (!Number.isFinite(minor) || minor < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!user || user.role !== "DONOR") {
      router.push(`/login?role=donor&from=/projects/${projectId}`);
      return;
    }
    try {
      const t = getToken();
      const res = await apiFetch<{ url: string }>(
        "/donations/checkout",
        {
          method: "POST",
          body: JSON.stringify({ projectId, amountMinor: minor }),
        },
        t
      );
      if (res.url) window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  const donateMpesa = async () => {
    const minor = Math.round(parseFloat(amount));
    if (!Number.isFinite(minor) || minor < 100) {
      toast.error("Enter at least 100 minor units (1 KES)");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter the M-Pesa phone number that will receive the STK prompt");
      return;
    }
    if (!user || user.role !== "DONOR") {
      router.push(`/login?role=donor&from=/projects/${projectId}`);
      return;
    }
    try {
      const t = getToken();
      const res = await apiFetch<{
        donationId: string;
        customerMessage?: string;
      }>(
        "/donations/mpesa/initiate",
        {
          method: "POST",
          body: JSON.stringify({ projectId, amountMinor: minor, phone: phone.trim() }),
        },
        t
      );
      toast.message(res.customerMessage ?? "Check your phone to complete payment on M-Pesa.");
      setMpesaDonationId(res.donationId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "M-Pesa request failed");
    }
  };

  if (!hydrated) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <Label htmlFor="amount">Amount ({currency}, minor units — e.g. 10000 = 100.00 if 2-decimal)</Label>
      <Input
        id="amount"
        type="number"
        min={1}
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="text-base"
      />
      <p className="text-xs text-muted-foreground">
        Stripe uses card wallets in minor units. M-Pesa STK uses whole Kenya shillings derived from minor units
        (amount ÷ 100 for KES).
      </p>
      {user?.role === "DONOR" ? (
        <div className="space-y-3">
          <Button className="w-full min-h-11" type="button" onClick={donate}>
            Donate with Stripe
          </Button>
          {isKes ? (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <Label htmlFor="mpesa-phone">M-Pesa phone (STK prompt)</Label>
              <Input
                id="mpesa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="07… or 2547…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-base"
              />
              <Button
                className="w-full min-h-11"
                type="button"
                variant="secondary"
                disabled={!!mpesaDonationId}
                onClick={donateMpesa}
              >
                {mpesaDonationId ? "Waiting for M-Pesa…" : "Pay with M-Pesa (STK)"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Button asChild className="w-full min-h-11">
            <Link href={`/register?role=donor`}>Register as donor</Link>
          </Button>
          <Button asChild variant="outline" className="w-full min-h-11">
            <Link href={`/login?role=donor`}>Sign in to donate</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
