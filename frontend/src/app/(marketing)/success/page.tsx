import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckoutSuccessFinalize } from "./checkout-success-finalize";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Payment complete</h1>
      <p className="mt-3 text-muted-foreground">
        Stripe returned you here after Checkout. We confirm the session with your API so totals update even if
        webhooks are not forwarded (e.g. run <code className="rounded bg-muted px-1">stripe listen</code> for best
        results).
      </p>
      <CheckoutSuccessFinalize sessionId={sessionId} />
      {sessionId ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground break-all">Session: {sessionId}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/donor">Donor dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
