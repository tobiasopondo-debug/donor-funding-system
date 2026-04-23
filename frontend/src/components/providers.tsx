"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getToken, setToken } from "@/lib/api";
import { useAuthStore, type User } from "@/stores/auth-store";

function AuthBootstrap() {
  const { setSession, clearSession, setHydrated } = useAuthStore();

  useEffect(() => {
    const run = async () => {
      const existing = getToken();
      if (existing) {
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const r = await fetch(`${base}/auth/me`, {
          headers: { Authorization: `Bearer ${existing}` },
        });
        if (r.ok) {
          const user = (await r.json()) as User;
          setSession(existing, user);
          setHydrated(true);
          return;
        }
      }
      const ref = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (ref.ok) {
        const data = (await ref.json()) as { accessToken: string; user: User };
        setToken(data.accessToken);
        setSession(data.accessToken, data.user);
      } else {
        clearSession();
        setToken(null);
      }
      setHydrated(true);
    };
    void run();
  }, [setSession, clearSession, setHydrated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthBootstrap />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
