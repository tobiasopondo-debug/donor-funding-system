"use client";

import { MinioImage } from "@/components/ui/minio-image";

export function ProjectDetailHero({ imageFileId, title }: { imageFileId: string | null; title: string }) {
  if (!imageFileId) {
    return (
      <div
        className="-mx-4 mb-8 h-48 bg-gradient-to-br from-primary/15 to-muted sm:-mx-6 sm:h-64"
        aria-hidden
      />
    );
  }
  return (
    <div className="-mx-4 mb-8 sm:-mx-6">
      <MinioImage
        fileId={imageFileId}
        className="max-h-80 w-full object-cover"
        alt={title}
        fallback={<div className="h-48 bg-gradient-to-br from-primary/15 to-muted sm:h-64" />}
      />
    </div>
  );
}
