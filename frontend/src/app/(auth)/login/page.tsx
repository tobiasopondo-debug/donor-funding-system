"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setToken } from "@/lib/api";
import { useAuthStore, type User } from "@/stores/auth-store";

function LoginForm() {
  const sp = useSearchParams();
  const roleHint = sp.get("role");
  const router = useRouter();
  const { setSession, setHydrated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = (await r.json()) as { accessToken?: string; user?: User; message?: string };
      if (!r.ok) throw new Error(data.message ?? "Login failed");
      if (data.accessToken && data.user) {
        setToken(data.accessToken);
        setSession(data.accessToken, data.user);
        setHydrated(true);
        if (data.user.role === "DONOR") router.replace("/donor");
        else if (data.user.role === "NGO_USER") router.replace("/ngo");
        else if (data.user.role === "PLATFORM_ADMIN") router.replace("/admin");
        else router.replace("/");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {roleHint === "ngo" && "NGO workspace"}
          {roleHint === "donor" && "Donor workspace"}
          {!roleHint && "You are routed by role after login."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button className="w-full min-h-11" type="submit" disabled={loading}>
            {loading ? "…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/register" className="text-primary">
            Register
          </Link>{" "}
          ·{" "}
          <Link href="/" className="text-primary">
            Home
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
