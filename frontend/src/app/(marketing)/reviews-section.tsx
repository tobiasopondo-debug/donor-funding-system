"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
  {
    quote:
      "Finally a catalog where I can see the org was reviewed before I give. Project pages and receipts make it obvious what my gift supported.",
    name: "Wanjiku M.",
    role: "Individual donor · Nairobi",
  },
  {
    quote:
      "The draft-to-publish flow and file uploads for verification match how we already work—just with less email chaos. Totals per project help our board reporting.",
    name: "Program lead",
    role: "Community NGO · demo feedback",
  },
  {
    quote:
      "As someone evaluating tools for a small foundation, the emphasis on admin approval and Stripe-backed records is the minimum bar we needed to take a pilot seriously.",
    name: "James O.",
    role: "Philanthropy advisor",
  },
];

export function ReviewsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">What people are saying</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
        Early feedback from donors, NGO staff, and reviewers trying the platform—not paid endorsements.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full border-border/80">
              <CardContent className="flex flex-col gap-4 pt-6">
                <Quote className="h-8 w-8 text-primary/70" aria-hidden />
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">&ldquo;{r.quote}&rdquo;</p>
                <div className="mt-auto border-t border-border/60 pt-4">
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
