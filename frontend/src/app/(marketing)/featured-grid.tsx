"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatKES } from "@/lib/api";
import { MinioImage } from "@/components/ui/minio-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Project = {
  id: string;
  title: string;
  summary: string;
  raisedAmountMinor: number;
  goalAmountMinor: number;
  currency?: string;
  files?: { id: string; kind: string }[];
};

export function FeaturedGrid({ projects }: { projects: Project[] }) {
  if (!projects.length) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No featured projects yet. NGOs can register and publish after approval.
      </p>
    );
  }
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
      {projects.map((p, i) => {
        const pct = Math.min(100, (p.raisedAmountMinor / Math.max(1, p.goalAmountMinor)) * 100);
        return (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
          className="w-[min(100%,20rem)] shrink-0 snap-center sm:w-[22rem] md:w-auto md:shrink"
        >
            <Link href={`/projects/${p.id}`}>
            <Card className="h-full cursor-pointer overflow-hidden border-border/80 transition-shadow hover:shadow-md">
              {p.files?.[0] && (
                <div className="border-b border-border/60">
                  <MinioImage
                    fileId={p.files[0].id}
                    className="aspect-[16/9] w-full object-cover"
                    alt=""
                    fallback={
                      <div
                        className="aspect-[16/9] w-full"
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--muted)))`,
                        }}
                      />
                    }
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2 text-base">{p.title}</CardTitle>
                <CardDescription className="line-clamp-3">{p.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p>
                  {Math.round(pct)}% · {formatKES(p.raisedAmountMinor, p.currency ?? "KES")} /{" "}
                  {formatKES(p.goalAmountMinor, p.currency ?? "KES")}
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
        );
      })}
    </div>
  );
}
