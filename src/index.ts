import { Hono } from "hono";
import checkArea from "../handlers/check-area.js";
import book from "../handlers/book.js";
import logCall from "../handlers/log-call.js";
import queue from "../handlers/queue.js";
import calendar from "../handlers/calendar.js";
import review from "../handlers/review.js";
import calls from "../handlers/calls.js";
import myLeads from "../handlers/my-leads.js";
import setStatus from "../handlers/set-status.js";
import telegram from "../handlers/telegram.js";
import health from "../handlers/health.js";
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
  const fields = body && typeof body === "object" ? Object.keys(body as object).join(",") : typeof body;
  console.log(`tool ${c.req.method} ${c.req.path} -> ${status} fields=[${fields}] key_header=${headers["x-api-key"] ? "present" : "missing"}`);
  return c.json(payload ?? { ok: true }, status);
}

const app = new Hono();
app.use("*", async (c, next) => {
  await next();
  console.log(`req ${c.req.method} ${c.req.path} -> ${c.res.status} ua=${(c.req.header("user-agent") || "").slice(0, 40)}`);
});
app.notFound((c) => c.json({ error: "not found" }, 404));
app.get("/", (c) => c.html(pages.index));
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
