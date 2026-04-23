"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiBase } from "@/lib/api";

type UpdateRow = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; email: string };
};

export function ProjectUpdatesList({ projectId }: { projectId: string }) {
  const q = useQuery({
    queryKey: ["project-updates", projectId],
    queryFn: async () => {
      const r = await fetch(`${getApiBase()}/project-updates/public/${projectId}`);
      if (!r.ok) return [] as UpdateRow[];
      return r.json() as Promise<UpdateRow[]>;
    },
  });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading updates…</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">No updates from the NGO yet.</p>;
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Project updates</h2>
      <ul className="space-y-3">
        {q.data.map((u) => (
          <li key={u.id} className="rounded-lg border border-border/60 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{u.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(u.createdAt).toLocaleString()} · {u.author.email}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
