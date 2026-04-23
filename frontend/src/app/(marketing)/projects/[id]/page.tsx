import { notFound } from "next/navigation";
import { ProjectDetailHero } from "@/components/marketing/project-detail-hero";
import { ProjectMarkdownBody } from "@/components/marketing/project-markdown-body";
import { ProjectUpdatesList } from "@/components/marketing/project-updates-list";
import { formatKES, getApiBase } from "@/lib/api";
import { DonateBox } from "./donate-box";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let project: {
    id: string;
    title: string;
    summary: string;
    description: string;
    goalAmountMinor: number;
    raisedAmountMinor: number;
    currency: string;
    organization: { displayName: string; id: string };
    files?: { id: string; kind: string }[];
    startDate?: string | null;
    endDate?: string | null;
  } | null = null;
  try {
    const r = await fetch(`${getApiBase()}/projects/public/${id}`, { next: { revalidate: 30 } });
    if (r.ok) project = await r.json();
  } catch {
    project = null;
  }
  if (!project) notFound();
  const pct = Math.min(100, (project.raisedAmountMinor / Math.max(1, project.goalAmountMinor)) * 100);
  const imageFileId = project.files?.find((f) => f.kind === "PROJECT_IMAGE")?.id ?? null;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <ProjectDetailHero imageFileId={imageFileId} title={project.title} />
      <p className="text-sm font-medium text-accent">{project.organization.displayName}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{project.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{project.summary}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatKES(project.raisedAmountMinor, project.currency)} of {formatKES(project.goalAmountMinor, project.currency)} raised
      </p>
      {(project.startDate || project.endDate) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {project.startDate && <span>Starts {new Date(project.startDate).toLocaleDateString()}</span>}
          {project.startDate && project.endDate && <span> · </span>}
          {project.endDate && <span>Ends {new Date(project.endDate).toLocaleDateString()}</span>}
        </p>
      )}
      <div className="mt-8 max-w-none">
        <ProjectMarkdownBody text={project.description} />
      </div>
      <ProjectUpdatesList projectId={project.id} />
      <div className="mt-10 max-w-md">
        <DonateBox projectId={project.id} currency={project.currency} />
      </div>
    </div>
  );
}
