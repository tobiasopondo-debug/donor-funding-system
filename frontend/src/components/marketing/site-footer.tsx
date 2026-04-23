import Link from "next/link";
import { Heart } from "lucide-react";

const product = [
  { href: "/projects", label: "Projects" },
  { href: "/orgs", label: "Organizations" },
];

const account = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/80 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Heart className="h-4 w-4 fill-current" aria-hidden />
              </span>
              DonorConnect Kenya
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Connecting verified NGOs with donors through transparent project funding and clear giving history.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {account.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <span className="leading-relaxed">Use of this platform is subject to your own diligence on organizations and projects.</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            © {year} DonorConnect Kenya. All rights reserved.
          </p>
          <p className="text-center text-xs text-muted-foreground sm:text-right">Built for clarity in Kenyan philanthropy.</p>
        </div>
      </div>
    </footer>
  );
}
