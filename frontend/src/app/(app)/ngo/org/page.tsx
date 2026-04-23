"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/ui/file-uploader";
import { MinioImage } from "@/components/ui/minio-image";
import { apiFetch, getToken } from "@/lib/api";

type OrgFile = { id: string; kind: string; mimeType: string; deletedAt?: string | null };

type Org = {
  id: string;
  displayName: string;
  legalName: string;
  mission: string;
  location: string | null;
  contactEmail: string;
  contactPhone: string | null;
  status: string;
  reviewNote: string | null;
  files?: OrgFile[];
};

const empty = {
  legalName: "",
  displayName: "",
  mission: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
};

export default function NgoOrgPage() {
  const qc = useQueryClient();
  const org = useQuery({
    queryKey: ["org", "me"],
    queryFn: async () => {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const t = getToken();
      const r = await fetch(`${base}/organizations/me`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Failed to load org");
      return r.json() as Promise<Org>;
    },
  });
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (org.data) {
      setForm({
        legalName: org.data.legalName,
        displayName: org.data.displayName,
        mission: org.data.mission,
        location: org.data.location ?? "",
        contactEmail: org.data.contactEmail,
        contactPhone: org.data.contactPhone ?? "",
      });
    }
  }, [org.data]);

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Org>(
        "/organizations/me",
        {
          method: "POST",
          body: JSON.stringify({
            legalName: form.legalName,
            displayName: form.displayName,
            mission: form.mission,
            location: form.location || undefined,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone || undefined,
          }),
        },
        getToken()
      ),
    onSuccess: () => {
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: ["org", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: () =>
      apiFetch<Org>(
        "/organizations/me",
        {
          method: "PATCH",
          body: JSON.stringify({
            legalName: form.legalName,
            displayName: form.displayName,
            mission: form.mission,
            location: form.location || undefined,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone || undefined,
          }),
        },
        getToken()
      ),
    onSuccess: () => {
      toast.success("Updated");
      void qc.invalidateQueries({ queryKey: ["org", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delFile = useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/files/${id}`, { method: "DELETE" }, getToken()),
    onSuccess: () => {
      toast.success("Removed");
      void qc.invalidateQueries({ queryKey: ["org", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (org.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (org.isError) return <p className="text-sm text-destructive">Could not load organization.</p>;

  if (org.data === null) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Register NGO</h1>
        <Card>
          <CardHeader>
            <CardTitle>Organization details</CardTitle>
            <CardDescription>Submit for platform review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Legal name</Label>
              <Input value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} />
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Mission</Label>
              <Textarea
                value={form.mission}
                onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
                rows={4}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label>Contact email</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <Button type="button" onClick={() => create.mutate()}>
              Create organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const o = org.data;
  if (!o) return null;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Organization</h1>
      <Card>
        <CardHeader>
          <CardTitle>{o.displayName}</CardTitle>
          <CardDescription>Status: {o.status}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {o.reviewNote && <p className="rounded-lg bg-muted p-2 text-sm">Admin: {o.reviewNote}</p>}
          <div>
            <Label>Display name</Label>
            <Input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div>
            <Label>Mission</Label>
            <Textarea
              value={form.mission}
              onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
              rows={4}
            />
          </div>
          <Button type="button" onClick={() => update.mutate()}>
            Save
          </Button>
          <div className="space-y-4 border-t border-border/60 pt-4">
            <p className="text-sm font-medium">Media & verification</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Logo</p>
                {o.files?.find((f) => f.kind === "NGO_LOGO") && (
                  <MinioImage
                    fileId={o.files.find((f) => f.kind === "NGO_LOGO")!.id}
                    className="mb-2 h-20 w-20 rounded-md object-cover"
                    alt="Logo"
                    auth
                  />
                )}
                <FileUploader
                  kind="NGO_LOGO"
                  label="Upload logo"
                  onUploaded={() => void qc.invalidateQueries({ queryKey: ["org", "me"] })}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Banner</p>
                {o.files?.find((f) => f.kind === "NGO_BANNER") && (
                  <MinioImage
                    fileId={o.files.find((f) => f.kind === "NGO_BANNER")!.id}
                    className="mb-2 h-16 w-full max-w-xs rounded-md object-cover"
                    alt="Banner"
                    auth
                  />
                )}
                <FileUploader
                  kind="NGO_BANNER"
                  label="Upload banner"
                  onUploaded={() => void qc.invalidateQueries({ queryKey: ["org", "me"] })}
                />
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Gallery (add several)</p>
              <div className="mb-2 flex flex-wrap gap-2">
                {(o.files ?? [])
                  .filter((f) => f.kind === "NGO_GALLERY")
                  .map((f) => (
                    <div key={f.id} className="relative">
                      <MinioImage fileId={f.id} className="h-20 w-20 rounded-md object-cover" alt="Gallery" auth />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="mt-1 w-full"
                        onClick={() => delFile.mutate(f.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
              </div>
              <FileUploader
                kind="NGO_GALLERY"
                label="Add gallery image"
                onUploaded={() => void qc.invalidateQueries({ queryKey: ["org", "me"] })}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Verification documents (PDF or image)</p>
              <ul className="mb-2 list-inside list-disc text-xs text-muted-foreground">
                {(o.files ?? [])
                  .filter((f) => f.kind === "VERIFICATION_DOC")
                  .map((f) => (
                    <li key={f.id}>Document {f.id.slice(0, 8)}…</li>
                  ))}
              </ul>
              <FileUploader
                kind="VERIFICATION_DOC"
                label="Upload verification document"
                accept="image/*,application/pdf"
                onUploaded={() => void qc.invalidateQueries({ queryKey: ["org", "me"] })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
