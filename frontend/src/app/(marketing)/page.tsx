import { getApiBase } from "@/lib/api";
import type { PublicStats } from "./hero-section";
import { FeaturedGrid } from "./featured-grid";
import { HeroSection } from "./hero-section";
import { StepsSection } from "./steps-section";

export default async function LandingPage() {
  let stats: PublicStats | null = null;
  let projects: {
    id: string;
    title: string;
    summary: string;
    raisedAmountMinor: number;
    goalAmountMinor: number;
    currency?: string;
    files?: { id: string; kind: string }[];
  }[] = [];
  try {
    const [s, p] = await Promise.all([
      fetch(`${getApiBase()}/reports/public`, { next: { revalidate: 60 } }),
      fetch(`${getApiBase()}/projects/public`, { next: { revalidate: 60 } }),
    ]);
    if (s.ok) stats = (await s.json()) as PublicStats;
    if (p.ok) projects = (await p.json()) as typeof projects;
  } catch {
    /* API down during build */
  }
  return (
    <div>
      <HeroSection stats={stats} />
      <StepsSection />
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold">Featured projects</h2>
          <div className="mt-10">
            <FeaturedGrid projects={projects.slice(0, 3)} />
          </div>
        </div>
      </section>
    </div>
  );
}
