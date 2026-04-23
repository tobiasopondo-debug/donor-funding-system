import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string }>;
}) {
  const { project_id: projectId } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout cancelled</h1>
      <p className="mt-3 text-muted-foreground">No charge was completed. You can try again whenever you like.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {projectId ? (
          <Button asChild>
            <Link href={`/projects/${projectId}`}>Back to project</Link>
          </Button>
        ) : null}
        <Button asChild variant={projectId ? "outline" : "default"}>
          <Link href="/projects">Browse projects</Link>
        </Button>
      </div>
    </div>
  );
}
