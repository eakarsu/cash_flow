import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/server/app.js";
import { bootstrapUser } from "../../src/server/auth.js";
import type { RuntimeConfig } from "../../src/server/config.js";
import { testDatabase } from "../helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

const config: RuntimeConfig = {
  databasePath: ":memory:", publicAppUrl: "http://127.0.0.1", production: false,
  operatorToken: "test-operator-token", auditorToken: "test-auditor-token",
  providerSecret: "test-provider-secret", identityHashSecret: "test-identity-secret",
  licensedProviders: new Set(["licensed-bank"]),
};

describe("secured finance HTTP journey", () => {
  it("rejects unauthorized access and accepts only signed licensed ingestion", async () => {
    const fixture = testDatabase();
    cleanups.push(fixture.cleanup);
    const app = createApp(fixture.db, config);
    expect((await request(app).get("/api/health")).body).toMatchObject({ mode: "paper_only", liveTrading: false });
    expect((await request(app).get("/api/v1/ledger")).status).toBe(401);
    const forbidden = await request(app).post("/api/v1/source-accounts").set("Authorization", `Bearer ${config.auditorToken}`).set("x-actor-id", "audit").send({});
    expect(forbidden.status).toBe(403);
    const account = await request(app).post("/api/v1/source-accounts").set("Authorization", `Bearer ${config.operatorToken}`).set("x-actor-id", "alice")
      .send({ provider: "licensed-bank", externalAccountId: "bank-http", displayName: "HTTP bank", currency: "USD", custodyClass: "bank", licenseReference: "license-http" });
    expect(account.status).toBe(201);
    const now = new Date().toISOString();
    const body = { sourceAccountId: account.body.id, idempotencyKey: "http-batch-1", sourceAsOf: now, entries: [{ externalId: "http-txn-1", occurredAt: now, sourceTimestamp: now, currency: "USD", amountMinor: 50_000_00, description: "Signed provider cash" }] };
    expect((await request(app).post("/api/v1/provider-ingestions/licensed-bank").send(body)).status).toBe(401);
    const raw = JSON.stringify(body);
    const signature = createHmac("sha256", config.providerSecret).update(`${now}.${raw}`).digest("hex");
    const ingestion = await request(app).post("/api/v1/provider-ingestions/licensed-bank")
      .set("x-cashflow-timestamp", now).set("x-cashflow-signature", signature).set("content-type", "application/json").send(raw);
    expect(ingestion.status).toBe(202);
    expect(ingestion.body).toMatchObject({ status: "completed", inserted_count: 1 });
    const ledger = await request(app).get("/api/v1/ledger").set("Authorization", `Bearer ${config.auditorToken}`).set("x-actor-id", "audit");
    expect(ledger.body.data).toHaveLength(1);
  });

  it("uses HttpOnly sessions and rejects browser mutations without CSRF", async () => {
    const fixture = testDatabase();
    cleanups.push(fixture.cleanup);
    bootstrapUser(fixture.db, { email: "operator@example.test", password: "correct-horse-battery-staple", role: "operator" });
    const agent = request.agent(createApp(fixture.db, config));
    const login = await agent.post("/api/auth/login").send({ email: "operator@example.test", password: "correct-horse-battery-staple" });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    const now = new Date().toISOString();
    const body = { idempotencyKey: "session-manual-1", externalId: "session-manual-1", occurredAt: now, sourceTimestamp: now, currency: "USD", amountMinor: 100, description: "Session-protected entry" };
    expect((await agent.post("/api/v1/manual-transactions").send(body)).status).toBe(403);
    expect((await agent.post("/api/v1/manual-transactions").set("x-csrf-token", login.body.csrfToken).send(body)).status).toBe(201);
  });

  it("persists login lockout after repeated failures", async () => {
    const fixture = testDatabase();
    cleanups.push(fixture.cleanup);
    bootstrapUser(fixture.db, { email: "locked@example.test", password: "correct-horse-battery-staple", role: "operator" });
    const app = createApp(fixture.db, config);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await request(app).post("/api/auth/login").send({ email: "locked@example.test", password: "wrong-password-value" })).status).toBe(401);
    }
    expect((await request(app).post("/api/auth/login").send({ email: "locked@example.test", password: "correct-horse-battery-staple" })).status).toBe(429);
  });
});
