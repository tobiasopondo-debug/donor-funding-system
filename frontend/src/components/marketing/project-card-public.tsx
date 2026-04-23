"use client";

import Link from "next/link";
import { formatKES } from "@/lib/api";
import { MinioImage } from "@/components/ui/minio-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectCardPublic({
  id,
  title,
  summary,
  raisedAmountMinor,
  goalAmountMinor,
  currency,
  orgName,
  imageFileId,
}: {
  id: string;
  title: string;
  summary: string;
  raisedAmountMinor: number;
  goalAmountMinor: number;
  currency: string;
  orgName: string;
  imageFileId: string | null;
}) {
  return (
    <Link href={`/projects/${id}`}>
      <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
        {imageFileId && (
          <div className="border-b border-border/60">
            <MinioImage
              fileId={imageFileId}
              className="aspect-[16/9] w-full object-cover"
              alt=""
              fallback={
                <div
                  className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 to-muted"
                  aria-hidden
                />
              }
            />
          </div>
        )}
        <CardHeader>
          <p className="text-xs font-medium uppercase text-accent">{orgName}</p>
          <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
          <CardDescription className="line-clamp-3">{summary}</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {formatKES(raisedAmountMinor, currency)} / {formatKES(goalAmountMinor, currency)} raised
        </CardContent>
      </Card>
    </Link>
  );
}
