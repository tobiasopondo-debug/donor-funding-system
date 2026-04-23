"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

type Role = "DONOR" | "NGO_USER" | "PLATFORM_ADMIN";

export function RoleGate({
  allowed,
  children,
}: {
  allowed: readonly Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowed.includes(user.role as Role)) {
      if (user.role === "DONOR") router.replace("/donor");
      else if (user.role === "NGO_USER") router.replace("/ngo");
      else if (user.role === "PLATFORM_ADMIN") router.replace("/admin");
      else router.replace("/");
    }
  }, [hydrated, user, allowed, router]);

  if (!hydrated || !user || !allowed.includes(user.role as Role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
