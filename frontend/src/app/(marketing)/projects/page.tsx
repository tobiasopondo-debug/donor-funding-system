import { getApiBase } from "@/lib/api";
import { ProjectCardPublic } from "@/components/marketing/project-card-public";

type Project = {
  id: string;
  title: string;
  summary: string;
  goalAmountMinor: number;
  raisedAmountMinor: number;
  currency: string;
  organization: { displayName: string };
  files?: { id: string; kind: string }[];
};

export default async function ProjectsPage() {
  let projects: Project[] = [];
  try {
    const r = await fetch(`${getApiBase()}/projects/public`, { next: { revalidate: 30 } });
    if (r.ok) projects = await r.json();
  } catch {
    projects = [];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
      <p className="mt-2 text-muted-foreground">Published by approved organizations.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCardPublic
            key={p.id}
            id={p.id}
            title={p.title}
            summary={p.summary}
            raisedAmountMinor={p.raisedAmountMinor}
            goalAmountMinor={p.goalAmountMinor}
            currency={p.currency}
            orgName={p.organization.displayName}
            imageFileId={p.files?.find((f) => f.kind === "PROJECT_IMAGE")?.id ?? null}
          />
        ))}
      </div>
      {!projects.length && <p className="mt-8 text-sm text-muted-foreground">No projects yet.</p>}
    </div>
  );
}
