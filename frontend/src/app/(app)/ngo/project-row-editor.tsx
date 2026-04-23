"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/ui/file-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinioImage } from "@/components/ui/minio-image";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, formatKES, getToken } from "@/lib/api";

export type ProjectRow = {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: string;
  goalAmountMinor: number;
  raisedAmountMinor: number;
  currency?: string;
  startDate?: string | null;
  endDate?: string | null;
  files?: { id: string; kind: string }[];
};

function toInputDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function NgoProjectRowEditor({ p }: { p: ProjectRow }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(p.title);
  const [summary, setSummary] = useState(p.summary);
  const [description, setDescription] = useState(p.description);
  const [goal, setGoal] = useState(String(p.goalAmountMinor));
  const [start, setStart] = useState(toInputDate(p.startDate));
  const [end, setEnd] = useState(toInputDate(p.endDate));
  const [updateBody, setUpdateBody] = useState("");

  const patch = useMutation({
    mutationFn: () =>
      apiFetch(
        `/projects/me/${p.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            summary,
            description,
            goalAmountMinor: parseInt(goal, 10),
            currency: p.currency ?? "KES",
            ...(start ? { startDate: new Date(start).toISOString() } : {}),
            ...(end ? { endDate: new Date(end).toISOString() } : {}),
          }),
        },
        getToken(),
      ),
    onSuccess: () => {
      toast.success("Project saved");
      void qc.invalidateQueries({ queryKey: ["projects", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postUpdate = useMutation({
    mutationFn: () =>
      apiFetch(
        `/project-updates/me/${p.id}`,
        { method: "POST", body: JSON.stringify({ body: updateBody }) },
        getToken(),
      ),
    onSuccess: () => {
      toast.success("Update posted");
      setUpdateBody("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: () => apiFetch(`/projects/me/${p.id}/publish`, { method: "POST" }, getToken()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["projects", "me"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{p.title}</p>
            <p className="text-xs text-muted-foreground">
              {p.status} · {formatKES(p.raisedAmountMinor, p.currency ?? "KES")} /{" "}
              {formatKES(p.goalAmountMinor, p.currency ?? "KES")}
            </p>
            {p.files?.[0] && (
              <MinioImage
                fileId={p.files[0].id}
                className="mt-2 h-24 w-40 rounded-md object-cover"
                alt=""
                auth
              />
            )}
            <div className="mt-2">
              <FileUploader
                kind="PROJECT_IMAGE"
                projectId={p.id}
                label="Upload / replace project image"
                onUploaded={() => void qc.invalidateQueries({ queryKey: ["projects", "me"] })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {p.status === "DRAFT" && (
              <Button size="sm" onClick={() => publish.mutate()}>
                Publish
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href={`/projects/${p.id}`} target="_blank">
                Public view
              </Link>
            </Button>
            <Button size="sm" variant="secondary" type="button" onClick={() => setOpen((v) => !v)}>
              {open ? "Close editor" : "Edit / updates"}
            </Button>
          </div>
        </div>
        {open && (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Goal (minor units)</Label>
                <Input value={goal} onChange={(e) => setGoal(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Description (Markdown supported on public page)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Start date</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <Button type="button" onClick={() => patch.mutate()} disabled={patch.isPending}>
              {patch.isPending ? "Saving…" : "Save project"}
            </Button>
            <div className="rounded-lg border border-border/60 p-3">
              <Label>Post a public update</Label>
              <Textarea
                className="mt-2"
                rows={3}
                value={updateBody}
                onChange={(e) => setUpdateBody(e.target.value)}
                placeholder="Share progress with donors…"
              />
              <Button
                className="mt-2"
                type="button"
                size="sm"
                variant="secondary"
                disabled={!updateBody.trim() || postUpdate.isPending}
                onClick={() => postUpdate.mutate()}
              >
                {postUpdate.isPending ? "Posting…" : "Post update"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
