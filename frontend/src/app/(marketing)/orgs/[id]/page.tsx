import { notFound } from "next/navigation";
import { getServerApiBase } from "@/lib/api";
import { OrgProfilePublic } from "@/components/marketing/org-profile-public";

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  type ApiOrg = {
    id: string;
    displayName: string;
    mission: string;
    contactEmail: string;
    location: string | null;
    files: { id: string; kind: string }[];
    projects: {
      id: string;
      title: string;
      summary: string;
      raisedAmountMinor: number;
      goalAmountMinor: number;
      currency: string;
      files: { id: string; kind: string }[];
    }[];
  };
  let data: ApiOrg | null = null;
  try {
    const r = await fetch(`${getServerApiBase()}/organizations/public/${id}`, { next: { revalidate: 30 } });
    if (r.ok) data = (await r.json()) as ApiOrg;
  } catch {
    data = null;
  }
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <OrgProfilePublic
        orgId={data.id}
        displayName={data.displayName}
        mission={data.mission}
        contactEmail={data.contactEmail}
        location={data.location}
        files={data.files ?? []}
        projects={data.projects}
      />
    </div>
  );
}
