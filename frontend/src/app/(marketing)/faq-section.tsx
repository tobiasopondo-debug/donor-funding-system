"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs: { q: string; a: string }[] = [
  {
    q: "Who can publish projects and receive donations?",
    a: "Only organizations approved by platform administrators can create projects and accept gifts through the app. New NGOs register, upload verification documents, and wait in pending review until an admin approves or rejects the application.",
  },
  {
    q: "How does NGO verification work?",
    a: "NGOs complete a short profile and upload documents (for example registration materials) to secure storage. Staff review those files against your policy, then set the organization to approved or rejected. Unapproved orgs do not appear in public listings.",
  },
  {
    q: "What payment options are available?",
    a: "The prototype focuses on card checkout via Stripe in test mode first. Other rails (such as M-Pesa) can be added when you extend payments—your deployment configures what is actually enabled.",
  },
  {
    q: "Where does my donation go?",
    a: "Each gift is tied to a specific published project with a record in your database and payment identifiers from Stripe. For a classroom demo, funds typically settle in one Stripe balance unless you add Connect for per-NGO payouts later.",
  },
  {
    q: "Is giving through this site tax-deductible?",
    a: "This deployment is described as a platform demo for academic or pilot use. It is not legal or tax advice—donors and NGOs should verify status and receipts with qualified professionals and local rules.",
  },
  {
    q: "How do I sign up as a donor or NGO?",
    a: "Use Register in the header: choose donor to browse and donate after sign-in, or NGO to start an organization application. Platform admin accounts are created by seed or manual setup, not public registration.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked questions</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
          Straight answers based on how the product modules are designed to behave.
        </p>
        <ul className="mt-10 space-y-2">
          {faqs.map((item, i) => {
            const open = openIndex === i;
            return (
              <motion.li
                key={item.q}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="rounded-lg border border-border/80 bg-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-foreground hover:bg-muted/40 sm:text-base"
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {open && (
                  <div className="border-t border-border/60 px-4 pb-4 pt-0">
                    <p className="pt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
