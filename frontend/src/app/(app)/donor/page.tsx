"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, formatKES, getToken } from "@/lib/api";

export default function DonorDashboard() {
  const stats = useQuery({
    queryKey: ["reports", "donor"],
    queryFn: () => apiFetch<{ totalGivenMinor: number; giftCount: number }>("/reports/donor", {}, getToken()),
  });
  const gifts = useQuery({
    queryKey: ["donations", "me"],
    queryFn: () =>
      apiFetch<
        {
          id: string;
          amountMinor: number;
          currency: string;
          status: string;
          project: { id: string; title: string; organization: { id: string; displayName: string } };
        }[]
      >("/donations/me", {}, getToken()),
  });

  const chartData = (gifts.data ?? []).slice(0, 10).map((g) => ({
    name: g.project.title.slice(0, 14) + (g.project.title.length > 14 ? "…" : ""),
    amount: g.amountMinor,
  }));
  const supported = Array.from(new Map((gifts.data ?? []).map((g) => [g.project.id, g])).values());
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your giving</h1>
        <p className="text-muted-foreground">Donations and quick stats.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Total given</CardTitle>
              <CardDescription>Successful gifts</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold tabular-nums">
              {stats.data != null ? formatKES(stats.data.totalGivenMinor) : "—"}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Gifts</CardTitle>
              <CardDescription>Count of successful donations</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold tabular-nums">
              {stats.data?.giftCount ?? "—"}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Recent amounts</CardTitle>
          <CardDescription>Last gifts (visual)</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [formatKES(v, "KES"), "Amount"]} />
                <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet — fund a project from the catalog.</p>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Projects you have supported</CardTitle>
          <CardDescription>Quick links back to public project pages</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {supported.map((g) => (
            <Link
              key={g.project.id}
              className="rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-sm hover:bg-muted/40"
              href={`/projects/${g.project.id}`}
            >
              {g.project.title}
            </Link>
          ))}
          {!supported.length && <p className="text-sm text-muted-foreground">No projects yet.</p>}
        </CardContent>
      </Card>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(gifts.data ?? []).map((g) => (
            <div
              key={g.id}
              className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link className="font-medium text-primary hover:underline" href={`/projects/${g.project.id}`}>
                  {g.project.title}
                </Link>
                <p className="text-xs text-muted-foreground">{g.project.organization.displayName}</p>
              </div>
              <span className="tabular-nums text-muted-foreground sm:text-right">
                {formatKES(g.amountMinor, g.currency)} · {g.status}
              </span>
            </div>
          ))}
          {!gifts.data?.length && <p className="text-sm text-muted-foreground">No donations yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
