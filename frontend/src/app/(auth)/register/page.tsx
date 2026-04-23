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

function RegisterForm() {
  const sp = useSearchParams();
  const defaultRole = sp.get("role") === "ngo" ? "NGO_USER" : "DONOR";
  const router = useRouter();
  const { setSession, setHydrated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DONOR" | "NGO_USER">(defaultRole);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        credentials: "include",
      });
      const data = (await r.json()) as { accessToken?: string; user?: User; message?: string };
      if (!r.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message ?? "Failed");
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

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Register as a donor or as an NGO representative.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
              <Button
                type="button"
                variant={role === "DONOR" ? "default" : "outline"}
                onClick={() => setRole("DONOR")}
              >
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
            {loading ? "Creating…" : "Register"}
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
