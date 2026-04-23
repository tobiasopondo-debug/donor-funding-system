"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, formatKES, getToken } from "@/lib/api";

type AdminRep = {
  pendingOrgReviews: number;
  totalRaisedMinor: number;
  successfulDonationCount: number;
  donationsLast7Days: number;
  topProjects: {
    id: string;
    title: string;
    raisedAmountMinor: number;
    goalAmountMinor: number;
    organization: { displayName: string };
  }[];
  pendingOrgs: { id: string; displayName: string }[];
  recentDonations: {
    id: string;
    amountMinor: number;
    currency: string;
    createdAt: string;
    project: { title: string; organization: { displayName: string } };
    donor: { email: string };
  }[];
};

export default function AdminDashboard() {
  const q = useQuery({
    queryKey: ["reports", "admin"],
    queryFn: () => apiFetch<AdminRep>("/reports/admin", {}, getToken()),
  });
  const dayQ = useQuery({
    queryKey: ["reports", "admin", "donations-by-day"],
    queryFn: () =>
      apiFetch<{ series: { day: string; amountMinor: number; count: number }[] }>(
        "/reports/admin/donations-by-day",
        {},
        getToken(),
      ),
  });
  const rep = q.data;
  const chartData = (rep?.topProjects ?? []).map((p) => ({
    n: p.organization.displayName.slice(0, 8),
    raised: p.raisedAmountMinor,
  }));
  const series = (dayQ.data?.series ?? []).map((d) => ({
    day: d.day.slice(5),
    amountMinor: d.amountMinor,
    gifts: d.count,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Platform</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Pending reviews", v: rep?.pendingOrgReviews, format: "number" as const },
            { label: "Total raised", v: rep != null ? formatKES(rep.totalRaisedMinor) : undefined, format: "text" as const },
            { label: "Successful donations", v: rep?.successfulDonationCount, format: "number" as const },
            { label: "7d gifts", v: rep?.donationsLast7Days, format: "number" as const },
          ] as const
        ).map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardDescription>{c.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {q.isLoading
                    ? "…"
                    : c.format === "text"
                      ? (c.v ?? "—")
                      : (c.v ?? 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {!!rep?.pendingOrgs?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Pending NGO reviews</CardTitle>
            <CardDescription>Jump into approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {rep.pendingOrgs.map((o) => (
                <li key={o.id}>
                  <Link className="text-primary underline" href="/admin/orgs">
                    {o.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top projects</CardTitle>
            <CardDescription>By amount raised</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="n" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [formatKES(value), "Raised"]} />
                  <Bar dataKey="raised" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Donations (14 days)</CardTitle>
            <CardDescription>Daily successful gift volume</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {series.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number, name) =>
                      name === "amountMinor" ? [formatKES(value), "Amount"] : [value, "Gifts"]
                    }
                  />
                  <Line type="monotone" dataKey="amountMinor" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {!!rep?.recentDonations?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Recent donations</CardTitle>
            <CardDescription>Latest successful gifts (support)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-2">When</th>
                    <th className="py-2 pr-2">Amount</th>
                    <th className="py-2 pr-2">Project</th>
                    <th className="py-2">Donor (email)</th>
                  </tr>
                </thead>
                <tbody>
                  {rep.recentDonations.map((d) => (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="py-2 pr-2 tabular-nums text-muted-foreground">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-2 tabular-nums">
                        {formatKES(d.amountMinor, d.currency)}
                      </td>
                      <td className="py-2 pr-2">
                        {d.project.title} · {d.project.organization.displayName}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{d.donor.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
