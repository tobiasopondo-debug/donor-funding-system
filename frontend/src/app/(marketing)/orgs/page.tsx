import { getApiBase } from "@/lib/api";
import { OrgCard } from "@/components/marketing/org-card";

type Org = {
  id: string;
  displayName: string;
  mission: string;
  location: string | null;
  files?: { id: string; kind: string }[];
};

export default async function OrgsPage() {
  let orgs: Org[] = [];
  try {
    const r = await fetch(`${getApiBase()}/organizations/public`, { next: { revalidate: 30 } });
    if (r.ok) orgs = await r.json();
  } catch {
    orgs = [];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
      <p className="mt-2 text-muted-foreground">Only platform-approved NGOs are listed.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {orgs.map((o) => (
          <OrgCard
            key={o.id}
            id={o.id}
            displayName={o.displayName}
            mission={o.mission}
            location={o.location}
            logoFileId={o.files?.find((f) => f.kind === "NGO_LOGO")?.id ?? null}
          />
        ))}
        {!orgs.length && (
          <p className="text-sm text-muted-foreground">No organizations published yet—check back soon.</p>
        )}
      </div>
    </div>
  );
}
