import { Hono } from "hono";
import checkArea from "../api/check-area.js";
import book from "../api/book.js";
import logCall from "../api/log-call.js";
import queue from "../api/queue.js";
import calendar from "../api/calendar.js";
import review from "../api/review.js";
import calls from "../api/calls.js";
import myLeads from "../api/my-leads.js";
import setStatus from "../api/set-status.js";
import telegram from "../api/telegram.js";
import health from "../api/health.js";
import * as pages from "./pages";

type Handler = (req: any, res: any) => Promise<unknown>;

// The handlers were written for (req, res). This adapts a Hono request to that shape and back.
async function run(handler: Handler, c: any) {
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v: string, k: string) => (headers[k.toLowerCase()] = v));
  let body: unknown = {};
  if (c.req.method !== "GET") body = await c.req.json().catch(() => ({}));

  let status = 200;
  let payload: unknown;
  const res: any = {
    writableEnded: false,
    status(code: number) { status = code; return res; },
    json(b: unknown) { payload = b; res.writableEnded = true; return res; },
  };
  await handler({ method: c.req.method, headers, body, query: c.req.query() }, res);
  return c.json(payload ?? { ok: true }, status);
}

const app = new Hono();
app.get("/", (c) => c.text("Aangan Studio agent tools"));
app.get("/api/health", (c) => run(health, c));
app.post("/api/check-area", (c) => run(checkArea, c));
app.post("/api/book", (c) => run(book, c));
app.post("/api/log-call", (c) => run(logCall, c));
app.get("/api/queue", (c) => run(queue, c));
app.get("/api/calendar", (c) => run(calendar, c));
app.post("/api/review", (c) => run(review, c));
app.get("/api/calls", (c) => run(calls, c));
app.get("/api/my-leads", (c) => run(myLeads, c));
app.post("/api/set-status", (c) => run(setStatus, c));
app.post("/api/telegram", (c) => run(telegram, c));
app.get("/queue", (c) => c.html(pages.queue));
app.get("/calendar", (c) => c.html(pages.calendar));
app.get("/calls", (c) => c.html(pages.calls));
app.get("/designer", (c) => c.html(pages.designer));

export default app;
