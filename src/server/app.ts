import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type Database from "better-sqlite3";
import { authenticate, authorize, login, logout } from "./auth.js";
import type { RuntimeConfig } from "./config.js";
import { hmac, safeEqual } from "./crypto.js";
import { DEFAULT_WORKSPACE_ID } from "./database.js";
import {
  appendManualImport, appendManualTransaction, auditExport, correctEntry, createSourceAccount, DomainError, ingest, listLedger, reconcile,
} from "./ledger.js";
import {
  activateKillSwitch, operationsSnapshot, recordPaperFill, requestKillSwitchRelease, reviewKillSwitchRelease,
  reviewPaperOrder, runSimulation, submitPaperOrder,
} from "./risk.js";

interface RawRequest extends Request { rawBody?: Buffer }

function asyncRoute(handler: (request: RawRequest, response: Response) => unknown | Promise<unknown>) {
  return (request: RawRequest, response: Response, next: NextFunction) => Promise.resolve(handler(request, response)).catch(next);
}

function objectBody(request: Request): Record<string, any> {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) throw new DomainError("invalid_json", "A JSON object is required.", 400);
  return request.body as Record<string, any>;
}

function verifyProvider(request: RawRequest, config: RuntimeConfig): void {
  const timestamp = String(request.headers["x-cashflow-timestamp"] || "");
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) throw new DomainError("expired_webhook", "Provider timestamp is expired.", 401);
  const expected = hmac(`${timestamp}.${request.rawBody?.toString("utf8") || ""}`, config.providerSecret);
  if (!safeEqual(String(request.headers["x-cashflow-signature"] || ""), expected)) throw new DomainError("invalid_signature", "Provider signature is invalid.", 401);
}

export function createApp(db: Database.Database, config: RuntimeConfig) {
  const app = express();
  if (config.production) app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
      },
    },
    hsts: config.production ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: "no-referrer" },
  }));
  app.use(express.json({ limit: "1mb", verify: (request, _response, buffer) => { (request as RawRequest).rawBody = Buffer.from(buffer); } }));
  app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: "draft-8", legacyHeaders: false }));

  app.get("/api/health", (_request, response) => response.json({ status: "ok", mode: "paper_only", liveTrading: false, timestamp: new Date().toISOString() }));
  app.post("/api/auth/login", asyncRoute((request, response) => response.json(login(db, config, request, response, objectBody(request)))));
  const session = asyncRoute((request, response) => {
    const actor = authenticate(request, db, config);
    response.json({ authenticated: true, role: actor.role, csrfToken: actor.csrfToken || null });
  });
  app.get("/api/auth/session", session);
  app.get("/api/auth/me", session);
  app.post("/api/runtime-ai/cashflow-advice", asyncRoute(async (request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    const prompt = String(objectBody(request).prompt || "").trim();
    if (!prompt) throw new DomainError("invalid_prompt", "prompt is required.", 400);
    const apiKey = process.env.OPENROUTER_API_KEY, baseUrl = process.env.OPENROUTER_BASE_URL, model = process.env.OPENROUTER_MODEL;
    if (!apiKey || !baseUrl || !model) throw new Error("OpenRouter is not configured");
    const providerResponse = await fetch(baseUrl.replace(/\/$/, "") + "/chat/completions", {
      method: "POST", headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: "Provide concise cash-flow operations advice with risks and auditable next actions." }, { role: "user", content: prompt }], temperature: 0.2 }),
    });
    if (!providerResponse.ok) throw new Error("OpenRouter returned " + providerResponse.status);
    const payload = await providerResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenRouter returned empty content");
    const persistedId = randomUUID(), createdAt = new Date().toISOString();
    db.prepare("INSERT INTO runtime_ai_results(id,workspace_id,actor_id,prompt,content,provider,model,created_at) VALUES(?,?,?,?,?,'openrouter',?,?)")
      .run(persistedId, DEFAULT_WORKSPACE_ID, actor.id, prompt, content, model, createdAt);
    response.json({ content, provider: "openrouter", model, persistedId });
  }));
  app.post("/api/auth/logout", asyncRoute((request, response) => {
    authorize(request, db, config, "auditor", true);
    logout(db, config, request, response);
    response.status(204).end();
  }));

  app.get("/api/v1/ledger", asyncRoute((request, response) => {
    authorize(request, db, config, "auditor");
    response.json({ data: listLedger(db, Number(request.query.limit || 200)) });
  }));
  app.get("/api/v1/source-accounts", asyncRoute((request, response) => {
    authorize(request, db, config, "auditor");
    const accounts = db.prepare(`SELECT id,provider,external_account_id,display_name,currency,custody_class,license_reference,licensed_at,active,created_at
      FROM source_accounts WHERE workspace_id=? ORDER BY created_at,id`).all(DEFAULT_WORKSPACE_ID);
    response.json({ data: accounts });
  }));
  app.post("/api/v1/source-accounts", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(createSourceAccount(db, actor.id, objectBody(request) as any, config.licensedProviders));
  }));
  app.post("/api/v1/provider-ingestions/:provider", asyncRoute((request, response) => {
    verifyProvider(request, config);
    const provider = String(request.params.provider);
    if (!config.licensedProviders.has(provider)) throw new DomainError("provider_not_licensed", "Provider is not approved.", 403);
    response.status(202).json(ingest(db, `provider:${provider}`, { ...objectBody(request), provider } as any, config.licensedProviders));
  }));
  app.post("/api/v1/manual-transactions", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(appendManualTransaction(db, actor.id, objectBody(request) as any));
  }));
  app.post("/api/v1/manual-imports", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(appendManualImport(db, actor.id, objectBody(request) as any));
  }));
  app.post("/api/v1/ledger/:id/corrections", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    const body = objectBody(request);
    response.status(201).json(correctEntry(db, actor.id, String(request.params.id), body.correctionId, body.reason, body.corrected));
  }));
  app.post("/api/v1/reconciliations", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(reconcile(db, actor.id, objectBody(request) as any));
  }));
  app.get("/api/v1/audit-export", asyncRoute((request, response) => {
    authorize(request, db, config, "auditor");
    response.setHeader("Content-Disposition", `attachment; filename="cash-flow-audit-${new Date().toISOString().slice(0, 10)}.json"`);
    response.json(auditExport(db));
  }));
  app.get("/api/v1/operations", asyncRoute((request, response) => {
    authorize(request, db, config, "auditor");
    response.json(operationsSnapshot(db));
  }));
  app.post("/api/v1/paper/orders", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(submitPaperOrder(db, actor.id, objectBody(request) as any));
  }));
  app.post("/api/v1/paper/orders/:id/review", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    const body = objectBody(request);
    response.json(reviewPaperOrder(db, actor.id, String(request.params.id), body.decision, body.reason));
  }));
  app.post("/api/v1/paper/orders/:id/fills", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(recordPaperFill(db, actor.id, String(request.params.id), objectBody(request) as any));
  }));
  app.post("/api/v1/controls/kill-switch/activate", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.json(activateKillSwitch(db, actor.id, objectBody(request).reason));
  }));
  app.post("/api/v1/controls/kill-switch/release-requests", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(requestKillSwitchRelease(db, actor.id, objectBody(request).reason));
  }));
  app.post("/api/v1/controls/kill-switch/release-requests/:id/review", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.json(reviewKillSwitchRelease(db, actor.id, String(request.params.id), objectBody(request).decision));
  }));
  app.post("/api/v1/paper/simulations", asyncRoute((request, response) => {
    const actor = authorize(request, db, config, "operator", true);
    response.status(201).json(runSimulation(db, actor.id, objectBody(request).scenario));
  }));

  const webRoot = resolve(process.cwd(), "dist-web");
  if (existsSync(webRoot)) {
    app.use(express.static(webRoot, { index: false, maxAge: config.production ? "1h" : 0 }));
    app.get(/^(?!\/api\/).*/, (_request, response) => response.sendFile(resolve(webRoot, "index.html")));
  }
  app.use("/api", (_request, response) => response.status(404).json({ error: { code: "not_found", message: "API endpoint not found." } }));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof DomainError) return response.status(error.status).json({ error: { code: error.code, message: error.message } });
    if (error instanceof SyntaxError && "body" in error) return response.status(400).json({ error: { code: "invalid_json", message: "Malformed JSON." } });
    console.error("Unhandled request failure", error);
    return response.status(500).json({ error: { code: "internal_error", message: "Request failed." } });
  });
  return app;
}
