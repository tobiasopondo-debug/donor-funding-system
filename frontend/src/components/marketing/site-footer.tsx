import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">DonorConnect Kenya</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Platform demo for academic use. Not legal or tax advice. Verify organizations independently.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <Link href="/projects" className="text-muted-foreground hover:text-foreground">
              Browse projects
            </Link>
            <span className="text-muted-foreground">Privacy & Terms — coming soon</span>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
