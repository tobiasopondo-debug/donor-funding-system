"use client";

import Link from "next/link";
import { MinioImage } from "@/components/ui/minio-image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OrgCard({
  id,
  displayName,
  mission,
  location,
  logoFileId,
}: {
  id: string;
  displayName: string;
  mission: string;
  location: string | null;
  logoFileId: string | null;
}) {
  return (
    <Link href={`/orgs/${id}`}>
      <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start gap-3">
            {logoFileId ? (
              <MinioImage
                fileId={logoFileId}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                alt=""
                fallback={
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                    {displayName.slice(0, 1)}
                  </div>
                }
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                {displayName.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="line-clamp-2">{mission}</CardDescription>
              {location && <p className="mt-1 text-xs text-muted-foreground">{location}</p>}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
