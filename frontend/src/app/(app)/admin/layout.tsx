import Link from "next/link";
import { RoleGate } from "@/components/role-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed={["PLATFORM_ADMIN"]}>
      <div className="min-h-screen bg-muted/15">
        <div className="border-b border-border/60 bg-background/90">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
            <span className="font-semibold text-primary">Admin</span>
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin/orgs" className="text-muted-foreground hover:text-foreground">
              Reviews
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
