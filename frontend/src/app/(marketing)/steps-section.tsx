"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LineChart, Shield } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { step: 1, icon: Shield, title: "Verify", text: "NGOs upload documents and media; platform staff review to reduce fraud and build baseline trust before fundraising begins." },
  { step: 2, icon: CheckCircle2, title: "Publish", text: "Approved organizations publish project goals, timelines, and progress updates in one transparent catalog." },
  { step: 3, icon: ArrowRight, title: "Donate", text: "Donors fund a specific project (Stripe / M-Pesa) with a clear record that ties each gift to a goal and receipt." },
  { step: 4, icon: LineChart, title: "Track", text: "Donors and NGOs can see totals, history, and top-line analytics—so money is easier to follow than scattered appeals." },
];

export function StepsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
        From verification to tracking—designed for accountability in Kenyan NGO fundraising.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full border-border/80">
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {s.step}
                  </span>
                  <s.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <CardDescription className="text-pretty">{s.text}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
