import Link from "next/link";
import { RoleGate } from "@/components/role-gate";

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed={["DONOR"]}>
      <div className="min-h-screen bg-muted/15">
        <div className="border-b border-border/60 bg-background/90">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
            <span className="font-semibold text-primary">Donor</span>
            <Link href="/donor" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/projects" className="text-muted-foreground hover:text-foreground">
              Browse
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
