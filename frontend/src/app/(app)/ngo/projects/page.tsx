"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiFetch, getToken } from "@/lib/api";
import { NgoProjectRowEditor, type ProjectRow } from "../project-row-editor";
import { useState } from "react";

export default function NgoProjectsPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["projects", "me"],
    queryFn: () => apiFetch<ProjectRow[]>("/projects/me", {}, getToken()),
  });
  const [title, setTitle] = useState("New project");
  const [summary, setSummary] = useState("Short public summary of the work.");
  const [description, setDescription] = useState("Full description. At least twenty characters for validation.");
  const [goal, setGoal] = useState("50000");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      apiFetch<ProjectRow>(
        "/projects/me",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            summary,
            description,
            goalAmountMinor: parseInt(goal, 10),
            currency: "KES",
            ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
            ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
          }),
        },
        getToken()
      ),
    onSuccess: () => {
      toast.success("Project created");
      void qc.invalidateQueries({ queryKey: ["projects", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (list.isLoading) return <p className="text-sm">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Projects</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create (requires approved org)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-w-md">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Goal (minor units)</Label>
            <Input value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Start date (optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={() => create.mutate()}>Create draft</Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(list.data ?? []).map((p) => (
          <NgoProjectRowEditor key={p.id} p={p} />
        ))}
        {!list.data?.length && <p className="text-sm text-muted-foreground">No projects yet.</p>}
      </div>
    </div>
  );
}
