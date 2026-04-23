"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, getToken } from "@/lib/api";

type Pending = {
  id: string;
  displayName: string;
  legalName: string;
  status: string;
  owner: { email: string };
};

export default function AdminOrgsPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin", "pending"],
    queryFn: () => apiFetch<Pending[]>("/organizations/admin/pending", {}, getToken()),
  });

  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      apiFetch(
        `/organizations/admin/${id}/review`,
        { method: "POST", body: JSON.stringify({ status, reviewNote: status === "REJECTED" ? "Please update documents." : undefined }) },
        getToken()
      ),
    onSuccess: () => {
      toast.success("Updated");
      void qc.invalidateQueries({ queryKey: ["admin", "pending"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (list.isLoading) return <p className="text-sm">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending NGOs</h1>
      {(list.data ?? []).map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="text-lg">{o.displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {o.legalName} · {o.owner.email}
            </p>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" onClick={() => review.mutate({ id: o.id, status: "APPROVED" })}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => review.mutate({ id: o.id, status: "REJECTED" })}>
              Reject
            </Button>
          </CardContent>
        </Card>
      ))}
      {!list.data?.length && <p className="text-sm text-muted-foreground">No pending applications.</p>}
    </div>
  );
}
