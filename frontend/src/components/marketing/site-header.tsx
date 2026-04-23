"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/orgs", label: "Organizations" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { user, hydrated, clearSession } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" />
          </span>
          <span className="text-lg">DonorConnect</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          {hydrated && user ? (
            <>
              {user.role === "DONOR" && (
                <Button asChild variant="secondary" className="hidden sm:inline-flex">
                  <Link href="/donor">My giving</Link>
                </Button>
              )}
              {user.role === "NGO_USER" && (
                <Button asChild variant="secondary" className="hidden sm:inline-flex">
                  <Link href="/ngo">NGO console</Link>
                </Button>
              )}
              {user.role === "PLATFORM_ADMIN" && (
                <Button asChild variant="secondary" className="hidden sm:inline-flex">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={async () => {
                  const { getToken } = await import("@/lib/api");
                  const t = getToken();
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: t ? { Authorization: `Bearer ${t}` } : {},
                    credentials: "include",
                  });
                  (await import("@/lib/api")).setToken(null);
                  clearSession();
                  window.location.href = "/";
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login?role=ngo">NGO sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/login?role=donor">Donor sign in</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
