"use client";

import { motion } from "framer-motion";
import { Goal, HeartHandshake, ShieldCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const goals = [
  {
    icon: ShieldCheck,
    title: "Trust before fundraising",
    text: "No NGO can publish projects or collect donations until platform staff have reviewed verification documents and approved the organization.",
  },
  {
    icon: HeartHandshake,
    title: "One transparent catalog",
    text: "Approved organizations publish goals, timelines, and progress in one place so donors can browse with confidence instead of chasing scattered appeals.",
  },
  {
    icon: Goal,
    title: "Money you can follow",
    text: "Gifts tie to a specific project with receipts and history—so philanthropy is easier to understand and harder to hide.",
  },
];

export function AboutMissionSection() {
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">About DonorConnect Kenya</h2>
          <p className="mt-4 text-pretty text-sm text-muted-foreground sm:text-base">
            Kenyan NGOs need consistent funding and donors need clarity. This platform is a single place for verified
            organizations to show who they are, publish fundable projects, and receive money with a clear audit trail—while
            donors browse approved listings, pay safely, and see exactly what they funded.
          </p>
        </motion.div>

        <figure className="mx-auto mt-12 max-w-3xl rounded-xl border border-primary/20 bg-primary/5 px-6 py-8 text-center sm:px-10">
          <blockquote className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
            &ldquo;Trust the NGO → show real projects → move money → show history.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Implementation story — product modules
          </figcaption>
        </figure>

        <div className="mt-14">
          <h3 className="text-center text-xl font-semibold tracking-tight">Mission &amp; goals</h3>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            Aligned with how the platform is designed to work end to end.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="h-full border-border/80">
                  <CardHeader>
                    <g.icon className="h-8 w-8 text-primary" aria-hidden />
                    <CardTitle className="text-lg">{g.title}</CardTitle>
                    <CardDescription className="text-pretty">{g.text}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
