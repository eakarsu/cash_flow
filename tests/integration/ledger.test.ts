import { afterEach, describe, expect, it } from "vitest";
import { auditExport, correctEntry, createSourceAccount, ingest, listLedger, reconcile } from "../../src/server/ledger.js";
import { activateKillSwitch, recordPaperFill, requestKillSwitchRelease, reviewKillSwitchRelease, reviewPaperOrder, submitPaperOrder } from "../../src/server/risk.js";
import { testDatabase } from "../helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

function setup() {
  const fixture = testDatabase();
  cleanups.push(fixture.cleanup);
  const providers = new Set(["licensed-bank", "licensed-broker"]);
  const account = createSourceAccount(fixture.db, "operator:alice", {
    provider: "licensed-bank", externalAccountId: "bank-001", displayName: "Operating cash", currency: "USD", custodyClass: "bank", licenseReference: "contract-2026-001",
  }, providers);
  const broker = createSourceAccount(fixture.db, "operator:alice", {
    provider: "licensed-broker", externalAccountId: "broker-001", displayName: "Paper broker source", currency: "USD", custodyClass: "broker", licenseReference: "contract-2026-002",
  }, providers);
  return { ...fixture, providers, account, broker };
}

describe("ledger ingestion and reconciliation", () => {
  it("preserves idempotency, conflict evidence, corrections, source times, and hash chains", () => {
    const { db, providers, account } = setup();
    const occurredAt = "2026-07-18T12:00:00.000Z";
    const payload = {
      provider: "licensed-bank", sourceAccountId: String(account.id), idempotencyKey: "batch-1", sourceAsOf: "2026-07-18T12:05:00.000Z",
      entries: [{ externalId: "txn-1", sourceVersion: 1, occurredAt, sourceTimestamp: "2026-07-18T12:01:00.000Z", currency: "USD", amountMinor: 1_000_000_00, description: "Opening operating cash" }],
    };
    expect(ingest(db, "provider:licensed-bank", payload, providers)).toMatchObject({ status: "completed", inserted_count: 1 });
    expect(ingest(db, "provider:licensed-bank", payload, providers)).toMatchObject({ duplicateRequest: true });
    expect(ingest(db, "provider:licensed-bank", { ...payload, idempotencyKey: "batch-2" }, providers)).toMatchObject({ duplicate_count: 1, conflict_count: 0 });
    const conflict = ingest(db, "provider:licensed-bank", { ...payload, idempotencyKey: "batch-3", entries: [{ ...payload.entries[0], amountMinor: 999 }] }, providers);
    expect(conflict).toMatchObject({ status: "needs_review", conflict_count: 1 });
    const original = listLedger(db)[0];
    const correction = correctEntry(db, "operator:alice", String(original.id), "fix-1", "Provider corrected the amount", {
      occurredAt, sourceTimestamp: "2026-07-18T12:06:00.000Z", currency: "USD", amountMinor: 999_000_00, description: "Corrected operating cash", metadata: { ticket: "INC-1" },
    });
    expect(correction.reversalId).toBeTruthy();
    expect(() => db.prepare("UPDATE ledger_entries SET amount_minor=0 WHERE id=?").run(original.id)).toThrow(/append-only/);
    const result = reconcile(db, "operator:alice", {
      sourceAccountId: String(account.id), periodStart: "2026-07-18T00:00:00Z", periodEnd: "2026-07-19T00:00:00Z", sourceAsOf: "2026-07-21T00:00:00Z", openingBalanceMinor: 0, sourceClosingMinor: 999_000_00,
    });
    expect(result).toMatchObject({ status: "reconciled", discrepancy_minor: 0 });
    expect(auditExport(db).verification).toEqual({ ledgerHashChain: true, auditHashChain: true });
  });

  it("records corporate actions and enforces broker-only market custody", () => {
    const { db, providers, account, broker } = setup();
    const now = new Date().toISOString();
    const action = ingest(db, "provider:licensed-broker", {
      provider: "licensed-broker", sourceAccountId: String(broker.id), idempotencyKey: "corp-action-1", sourceAsOf: now,
      entries: [{ externalId: "dividend-1", eventType: "corporate_action", occurredAt: now, sourceTimestamp: now, currency: "USD", amountMinor: 12_500, description: "Cash dividend", metadata: { actionType: "cash_dividend", symbol: "ACME" } }],
    }, providers);
    expect(action).toMatchObject({ status: "completed", inserted_count: 1 });
    expect(listLedger(db)[0]).toMatchObject({ event_type: "corporate_action", amount_minor: 12_500 });
    expect(() => ingest(db, "provider:licensed-bank", {
      provider: "licensed-bank", sourceAccountId: String(account.id), idempotencyKey: "invalid-market-source", sourceAsOf: now, entries: [],
      marketSnapshots: [{ externalId: "bad-quote", symbol: "ACME", currency: "USD", priceMinor: 1_000, sourceTimestamp: now }],
    }, providers)).toThrow(/broker custody/);
  });
});

describe("paper order controls", () => {
  it("requires independent approval, handles duplicate and partial fills, and enforces two-person kill-switch release", () => {
    const { db, providers, account, broker } = setup();
    const now = new Date().toISOString();
    ingest(db, "provider:licensed-bank", {
      provider: "licensed-bank", sourceAccountId: String(account.id), idempotencyKey: "cash-1", sourceAsOf: now,
      entries: [{ externalId: "cash-1", occurredAt: now, sourceTimestamp: now, currency: "USD", amountMinor: 1_000_000_00, description: "Reconciled cash" }],
    }, providers);
    ingest(db, "provider:licensed-broker", {
      provider: "licensed-broker", sourceAccountId: String(broker.id), idempotencyKey: "market-1", sourceAsOf: now, entries: [],
      marketSnapshots: [{ externalId: "quote-1", symbol: "ACME", currency: "USD", priceMinor: 1_000, sourceTimestamp: now }],
    }, providers);
    const order = submitPaperOrder(db, "operator:alice", { clientOrderId: "client-order-1", symbol: "ACME", side: "buy", quantityMicros: 3_000_000_000 });
    expect(order.status).toBe("pending_approval");
    expect(() => reviewPaperOrder(db, "operator:alice", String(order.id), "approved", "Reviewed")).toThrow(/own order/);
    expect(reviewPaperOrder(db, "operator:bob", String(order.id), "approved", "Within approved strategy").status).toBe("approved");
    expect(recordPaperFill(db, "operator:broker-worker", String(order.id), { externalFillId: "fill-1", quantityMicros: 1_000_000_000, priceMinor: 1_001, sourceTimestamp: now })).toMatchObject({ status: "partial" });
    expect(recordPaperFill(db, "operator:broker-worker", String(order.id), { externalFillId: "fill-1", quantityMicros: 1_000_000_000, priceMinor: 1_001, sourceTimestamp: now })).toMatchObject({ duplicateRequest: true });
    expect(recordPaperFill(db, "operator:broker-worker", String(order.id), { externalFillId: "fill-2", quantityMicros: 2_000_000_000, priceMinor: 1_002, sourceTimestamp: now })).toMatchObject({ status: "filled", remainingQuantityMicros: 0 });
    expect(submitPaperOrder(db, "operator:alice", { clientOrderId: "client-order-1", symbol: "ACME", side: "buy", quantityMicros: 3_000_000_000 })).toMatchObject({ duplicateRequest: true });
    expect(activateKillSwitch(db, "operator:alice", "Provider integrity incident")).toMatchObject({ active: true });
    const release = requestKillSwitchRelease(db, "operator:alice", "Incident resolved with evidence");
    expect(() => reviewKillSwitchRelease(db, "operator:alice", String(release.id), "approved")).toThrow(/cannot release/);
    expect(reviewKillSwitchRelease(db, "operator:bob", String(release.id), "approved")).toMatchObject({ active: false });
  });
});
