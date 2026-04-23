import { appendFileSync } from "fs";
import { join } from "path";

/** Best-effort NDJSON line for local dev (Docker: try `docker cp web:/tmp/debug-ae2a6e.log .`). */
export function agentDebugAppend(payload: Record<string, unknown>) {
  const line = JSON.stringify({ ...payload, sessionId: "ae2a6e", timestamp: Date.now() }) + "\n";
  const dirs = [process.cwd(), join(process.cwd(), ".."), join(process.cwd(), "..", "..")];
  for (const d of dirs) {
    try {
      appendFileSync(join(d, "debug-ae2a6e.log"), line);
      return;
    } catch {
      /* try next */
    }
  }
  try {
    appendFileSync("/tmp/debug-ae2a6e.log", line);
  } catch {
    /* ignore */
  }
}
