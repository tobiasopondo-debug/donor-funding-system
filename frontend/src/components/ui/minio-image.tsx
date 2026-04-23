"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getApiBase, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

export function MinioImage({
  fileId,
  className,
  alt,
  auth = false,
  fallback,
}: {
  fileId: string;
  className?: string;
  alt: string;
  /** Use JWT (private doc / org owner) vs public URL */
  auth?: boolean;
  fallback?: ReactNode;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = auth
          ? `${getApiBase()}/files/${fileId}/view`
          : `${getApiBase()}/files/public/${fileId}/view`;
        const t = getToken();
        const r = await fetch(path, { headers: auth && t ? { Authorization: `Bearer ${t}` } : {} });
        if (!r.ok) {
          if (!cancelled) setErr(true);
          return;
        }
        const j = (await r.json()) as { url: string };
        if (!cancelled) setSrc(j.url);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId, auth]);

  if (err) return <>{fallback ?? <div className={cn("bg-muted", className)} role="img" aria-label={alt} />}</>;
  if (!src) {
    return <div className={cn("animate-pulse bg-muted", className)} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element -- signed MinIO URLs are dynamic
  return <img src={src} alt={alt} className={className} />;
}
