"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch, getToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingDisplay, StarRatingInput } from "@/components/ui/star-rating-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Summary = {
  average: number;
  count: number;
  ratings: { id: string; score: number; comment: string | null; createdAt: string; donorLabel: string }[];
};

export function OrgRatingsBlock({ orgId }: { orgId: string }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");

  const q = useQuery({
    queryKey: ["ratings", orgId],
    queryFn: async () => {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/ratings/public/${orgId}`,
      );
      if (!r.ok) throw new Error("Failed to load ratings");
      return r.json() as Promise<Summary>;
    },
  });

  const m = useMutation({
    mutationFn: () =>
      apiFetch(
        "/ratings/me",
        { method: "POST", body: JSON.stringify({ orgId, score, comment: comment || undefined }) },
        getToken(),
      ),
    onSuccess: () => {
      toast.success("Thanks for your feedback");
      void qc.invalidateQueries({ queryKey: ["ratings", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = q.data;
  return (
    <Card className="mt-10 border-border/80">
      <CardHeader>
        <CardTitle>Community ratings</CardTitle>
        <CardDescription>
          {data ? (
            <span className="flex flex-wrap items-center gap-2">
              <StarRatingDisplay value={Math.round(data.average) || 0} />
              <span className="text-foreground">
                {data.average ? data.average.toFixed(1) : "—"} / 5 · {data.count} reviews
              </span>
            </span>
          ) : (
            "Loading…"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {user?.role === "DONOR" && (
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <p className="text-sm font-medium">Rate this organization</p>
            <StarRatingInput value={score} onChange={setScore} />
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Optional comment"
            />
            <Button type="button" size="sm" onClick={() => m.mutate()} disabled={m.isPending}>
              {m.isPending ? "Saving…" : "Submit rating"}
            </Button>
          </div>
        )}
        <ul className="space-y-3">
          {(data?.ratings ?? []).map((r) => (
            <li key={r.id} className="rounded-md border border-border/50 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <StarRatingDisplay value={r.score} />
                <span className="text-xs text-muted-foreground">{r.donorLabel}</span>
              </div>
              {r.comment && <p className="mt-2 text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
