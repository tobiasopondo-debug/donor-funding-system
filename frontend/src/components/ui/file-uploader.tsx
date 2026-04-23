"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, getToken } from "@/lib/api";

export type UploadFileKind =
  | "VERIFICATION_DOC"
  | "NGO_LOGO"
  | "NGO_BANNER"
  | "NGO_GALLERY"
  | "PROJECT_IMAGE";

type PresignRes = { uploadUrl: string; objectKey: string; bucket: string; expiresIn: number };
type ConfirmRes = { id: string; kind: string; objectKey: string };

export function FileUploader({
  kind,
  projectId,
  label,
  accept = "image/*,application/pdf",
  onUploaded,
}: {
  kind: UploadFileKind;
  projectId?: string;
  label: string;
  accept?: string;
  onUploaded?: (file: ConfirmRes) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setProgress(0);
    try {
      const token = getToken();
      const presign = await apiFetch<PresignRes>(
        "/files/presign",
        {
          method: "POST",
          body: JSON.stringify({
            kind,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            ...(projectId ? { projectId } : {}),
          }),
        },
        token
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      const confirmed = await apiFetch<ConfirmRes>(
        "/files/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            kind,
            objectKey: presign.objectKey,
            bucket: presign.bucket,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            ...(projectId ? { projectId } : {}),
          }),
        },
        token
      );
      toast.success("File uploaded");
      onUploaded?.(confirmed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-1">
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={onChange} />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={pick}>
          {busy ? "Uploading…" : label}
        </Button>
        {progress != null && <span className="text-xs text-muted-foreground">{progress}%</span>}
      </div>
    </div>
  );
}
