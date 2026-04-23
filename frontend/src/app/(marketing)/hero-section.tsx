"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { formatKES } from "@/lib/api";
import { Button } from "@/components/ui/button";

export type PublicStats = {
  totalRaisedMinor: number;
  approvedOrgCount: number;
  publishedProjectCount: number;
};

export function HeroSection({ stats }: { stats: PublicStats | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='hsl(var(--primary))' stroke-opacity='0.12'%3E%3Cpath d='M0 0h80v80H0z'/%3E%3Cpath d='M40 0v80M0 40h80'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Kenya · Philanthropy</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Fund projects you <span className="text-primary">trust</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Kenyan NGOs need consistent funding and donors need clarity. This platform connects verified organizations
            with people who want to give—while keeping goals, progress, and receipts visible so philanthropy is easier
            to understand and harder to hide.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-11 min-w-44">
              <Link href="/projects">
                Browse projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-11 min-w-44">
              <Link href="/register?role=ngo">Register your NGO</Link>
            </Button>
          </div>
          {stats && (
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {formatKES(stats.totalRaisedMinor)}
                </p>
                <p>Total raised (successful gifts)</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {stats.approvedOrgCount.toLocaleString()}
                </p>
                <p>Approved NGOs</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {stats.publishedProjectCount.toLocaleString()}
                </p>
                <p>Live projects</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
