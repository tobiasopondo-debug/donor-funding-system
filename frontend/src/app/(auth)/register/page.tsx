"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setToken } from "@/lib/api";
import { useAuthStore, type User } from "@/stores/auth-store";

function parseMessage(data: { message?: string | string[] }) {
  const m = data.message;
  if (Array.isArray(m)) return m[0] ?? "Request failed";
  return m ?? "Request failed";
}

function RegisterForm() {
  const sp = useSearchParams();
  const defaultRole = sp.get("role") === "ngo" ? "NGO_USER" : "DONOR";
  const router = useRouter();
  const { setSession, setHydrated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DONOR" | "NGO_USER">(defaultRole);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendCooldown]);

  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        credentials: "include",
      });
      const data = (await r.json()) as {
        accessToken?: string;
        user?: User;
        requiresOtp?: boolean;
        challengeId?: string;
        message?: string | string[];
      };
      if (!r.ok) throw new Error(parseMessage(data));
      if (data.requiresOtp && data.challengeId) {
        setChallengeId(data.challengeId);
        setCode("");
        setStep("otp");
        toast.message("Check your email", { description: "Enter the 6-digit code we sent to verify your account." });
        return;
      }
      if (data.accessToken && data.user) {
        setToken(data.accessToken);
        setSession(data.accessToken, data.user);
        setHydrated(true);
        if (data.user.role === "DONOR") router.replace("/donor");
        else router.replace("/ngo");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || code.length !== 6) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
        credentials: "include",
      });
      const data = (await r.json()) as { accessToken?: string; user?: User; message?: string | string[] };
      if (!r.ok) throw new Error(parseMessage(data));
      if (data.accessToken && data.user) {
        setToken(data.accessToken);
        setSession(data.accessToken, data.user);
        setHydrated(true);
        if (data.user.role === "DONOR") router.replace("/donor");
        else router.replace("/ngo");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!challengeId || resendCooldown > 0) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
        credentials: "include",
      });
      const data = (await r.json()) as { message?: string | string[] };
      if (!r.ok) throw new Error(parseMessage(data));
      toast.success("A new code was sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp" && challengeId) {
    return (
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>We sent a 6-digit code to your inbox. Enter it below to activate your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1.5 text-center font-mono text-lg tracking-[0.35em]"
                placeholder="••••••"
                required
              />
            </div>
            <Button className="w-full min-h-11" type="submit" disabled={loading || code.length !== 6}>
              {loading ? "…" : "Verify & continue"}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                disabled={loading || resendCooldown > 0}
                onClick={onResend}
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("credentials");
                  setChallengeId(null);
                  setCode("");
                }}
              >
                Back
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Register as a donor or as an NGO representative.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmitCredentials} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password (min 8)</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
              minLength={8}
              required
            />
          </div>
          <div>
            <Label>Role</Label>
            <div className="mt-1.5 flex gap-2">
              <Button type="button" variant={role === "DONOR" ? "default" : "outline"} onClick={() => setRole("DONOR")}>
                Donor
              </Button>
              <Button
                type="button"
                variant={role === "NGO_USER" ? "default" : "outline"}
                onClick={() => setRole("NGO_USER")}
              >
                NGO
              </Button>
            </div>
          </div>
          <Button className="w-full min-h-11" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Continue"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
