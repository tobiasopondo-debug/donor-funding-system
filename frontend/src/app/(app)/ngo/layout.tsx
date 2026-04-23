import Link from "next/link";
import { RoleGate } from "@/components/role-gate";

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed={["NGO_USER"]}>
      <div className="min-h-screen bg-muted/15">
        <div className="border-b border-border/60 bg-background/90">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <span className="font-semibold text-primary">NGO</span>
            <Link href="/ngo" className="text-muted-foreground hover:text-foreground">
              Overview
            </Link>
            <Link href="/ngo/org" className="text-muted-foreground hover:text-foreground">
              Organization
            </Link>
            <Link href="/ngo/projects" className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link href="/" className="ml-auto text-muted-foreground hover:text-foreground">
              Site
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </div>
    </RoleGate>
  );
}
