"use client";

import Link from "next/link";
import { formatKES } from "@/lib/api";
import { MinioImage } from "@/components/ui/minio-image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgChatPanel } from "@/components/marketing/org-chat-panel";
import { OrgRatingsBlock } from "@/components/marketing/org-ratings-block";

type FileRef = { id: string; kind: string };
type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  raisedAmountMinor: number;
  goalAmountMinor: number;
  currency: string;
  files?: FileRef[];
};

export function OrgProfilePublic({
  orgId,
  displayName,
  mission,
  contactEmail,
  location,
  files,
  projects,
}: {
  orgId: string;
  displayName: string;
  mission: string;
  contactEmail: string;
  location: string | null;
  files: FileRef[];
  projects: ProjectItem[];
}) {
  const banner = files.find((f) => f.kind === "NGO_BANNER");
  const logo = files.find((f) => f.kind === "NGO_LOGO");
  const gallery = files.filter((f) => f.kind === "NGO_GALLERY");

  return (
    <div>
      <div className="relative -mx-4 overflow-hidden sm:-mx-6">
        {banner ? (
          <MinioImage
            fileId={banner.id}
            className="h-48 w-full object-cover sm:h-64"
            alt=""
            fallback={<div className="h-48 bg-gradient-to-br from-primary/15 to-muted sm:h-64" />}
          />
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/15 to-muted sm:h-64" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          {logo ? (
            <MinioImage
              fileId={logo.id}
              className="h-20 w-20 shrink-0 rounded-2xl border-2 border-background object-cover shadow-md sm:h-24 sm:w-24"
              alt=""
              fallback={
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-muted text-2xl font-bold sm:h-24 sm:w-24">
                  {displayName.slice(0, 1)}
                </div>
              }
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-primary/10 text-2xl font-bold text-primary sm:h-24 sm:w-24">
              {displayName.slice(0, 1)}
            </div>
          )}
          <div className="pb-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
            {location && <p className="text-sm text-muted-foreground">{location}</p>}
          </div>
        </div>
      </div>

      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        <blockquote className="border-l-4 border-primary/40 pl-4 text-base leading-relaxed not-italic text-muted-foreground">
          {mission}
        </blockquote>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Contact: {contactEmail}</p>

      {gallery.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Gallery</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((g) => (
              <MinioImage
                key={g.id}
                fileId={g.id}
                className="aspect-video w-full rounded-lg object-cover"
                alt=""
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold">Projects</h2>
      <div className="mt-4 space-y-3">
        {projects.map((p) => {
          const img = p.files?.[0];
          return (
            <Card key={p.id} className="border-border/80">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    {img && (
                      <MinioImage
                        fileId={img.id}
                        className="h-24 w-40 shrink-0 rounded-md object-cover"
                        alt=""
                      />
                    )}
                    <div>
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatKES(p.raisedAmountMinor, p.currency)} / {formatKES(p.goalAmountMinor, p.currency)} raised
                      </p>
                    </div>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={`/projects/${p.id}`}>View</Link>
                </Button>
              </CardHeader>
            </Card>
          );
        })}
        {!projects.length && <p className="text-sm text-muted-foreground">No published projects.</p>}
      </div>

      <OrgRatingsBlock orgId={orgId} />

      <OrgChatPanel orgId={orgId} />
    </div>
  );
}
