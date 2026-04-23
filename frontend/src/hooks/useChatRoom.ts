"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiBase, getToken } from "@/lib/api";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; email: string; role: string };
};

export function useChatRoom(orgId: string | null, enabled: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const sock = useRef<Socket | null>(null);

  useEffect(() => {
    if (!orgId || !enabled) return;
    const token = getToken();
    if (!token) return;
    void (async () => {
      try {
        const r = await fetch(`${getApiBase()}/chat/rooms/${orgId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = (await r.json()) as { messages: ChatMessage[] };
          setMessages(data.messages ?? []);
        }
      } catch {
        /* ignore */
      }
    })();

    const s = io(`${getApiBase()}/chat`, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });
    sock.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("message", (m: ChatMessage) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    s.emit("join", orgId);
    return () => {
      s.removeAllListeners();
      s.close();
      sock.current = null;
      setConnected(false);
    };
  }, [orgId, enabled]);

  const send = (body: string) => {
    if (!orgId || !sock.current) return;
    sock.current.emit("send", { orgId, body });
  };

  return { messages, send, connected };
}
