"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, formatKES, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function NgoHome() {
  const rep = useQuery({
    queryKey: ["reports", "ngo"],
    queryFn: () =>
      apiFetch<{
        organization: { displayName: string; status: string; mission: string } | null;
        projects: { id: string; title: string; goalAmountMinor: number; raisedAmountMinor: number; currency?: string }[];
        recentDonations: {
          id: string;
          amountMinor: number;
          currency: string;
          createdAt: string;
          project: { id: string; title: string };
          donor: { email: string };
        }[];
      }>("/reports/ngo", {}, getToken()),
  });

  const chart = (rep.data?.projects ?? []).map((p) => ({
    name: p.title.slice(0, 12),
    raised: p.raisedAmountMinor,
    goal: p.goalAmountMinor,
  }));

  if (!rep.data?.organization) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Create your organization profile to get reviewed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/ngo/org" className="text-primary underline">
            Set up organization
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{rep.data.organization.displayName}</h1>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            rep.data.organization.status === "PENDING_REVIEW" && "bg-amber-500/15 text-amber-900 dark:text-amber-200",
            rep.data.organization.status === "APPROVED" && "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200",
            rep.data.organization.status === "REJECTED" && "bg-red-500/15 text-red-900 dark:text-red-200",
            rep.data.organization.status === "SUSPENDED" && "bg-zinc-500/15 text-zinc-900 dark:text-zinc-200",
          )}
        >
          {rep.data.organization.status}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Raised vs goal</CardDescription>
            </CardHeader>
            <CardContent className="h-56">
              {chart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v: number, name) => [
                        formatKES(v, "KES"),
                        name === "raised" ? "Raised" : "Goal",
                      ]}
                    />
                    <Bar dataKey="raised" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="goal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">Add a published project to see data.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {rep.data.organization.status === "PENDING_REVIEW" && (
              <p>Your profile is awaiting admin review. Upload documents under Organization.</p>
            )}
            {rep.data.organization.status === "APPROVED" && (
              <p>
                You can publish projects.{" "}
                <Link className="text-primary underline" href="/ngo/projects">
                  Manage projects
                </Link>
              </p>
            )}
            {rep.data.organization.status === "REJECTED" && <p>Review the admin note on the org page.</p>}
          </CardContent>
        </Card>
      </div>

      {!!rep.data.recentDonations?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Recent successful donations</CardTitle>
            <CardDescription>Latest gifts to your projects</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-2">When</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2 pr-2">Project</th>
                  <th className="py-2">Donor</th>
                </tr>
              </thead>
              <tbody>
                {rep.data.recentDonations.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-xs text-muted-foreground tabular-nums">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">{formatKES(d.amountMinor, d.currency)}</td>
                    <td className="py-2 pr-2">{d.project.title}</td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {d.donor.email.replace(/@.*/, "@…")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
