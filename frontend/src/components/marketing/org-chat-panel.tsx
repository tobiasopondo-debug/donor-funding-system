"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatRoom } from "@/hooks/useChatRoom";
import { getToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OrgChatPanel({ orgId }: { orgId: string }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const token = getToken();
  const enabled = Boolean(hydrated && user && token);

  const { messages, send, connected } = useChatRoom(orgId, enabled);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!hydrated) return null;
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">Sign in to join the community chat for this organization.</p>
    );
  }
  if (user.role !== "DONOR" && user.role !== "NGO_USER" && user.role !== "PLATFORM_ADMIN") {
    return null;
  }

  return (
    <Card className="mt-10 border-border/80">
      <CardHeader>
        <CardTitle>Organization chat</CardTitle>
        <CardDescription>
          Real-time discussion for this NGO&apos;s community. {connected ? "Connected." : "Connecting…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto rounded-md border border-border/60 p-2 text-sm">
          {messages.map((m) => (
            <div key={m.id} className="mb-2 rounded-md bg-muted/30 p-2">
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.author.email} · {m.author.role} · {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <Textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
        />
        <Button
          type="button"
          onClick={() => {
            const t = text.trim();
            if (!t) return;
            send(t);
            setText("");
          }}
        >
          Send
        </Button>
      </CardContent>
    </Card>
  );
}
