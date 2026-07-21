import type Database from "better-sqlite3";
import { appendAudit, verifyAuditChain } from "./audit.js";
import { newId, sha256, stableJson } from "./crypto.js";
import { DEFAULT_WORKSPACE_ID, MANUAL_ACCOUNT_ID } from "./database.js";

export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 422) {
    super(message);
  }
}

export interface LedgerInput {
  externalId: string;
  sourceVersion?: number;
  eventType?: "transaction" | "corporate_action";
  occurredAt: string;
  sourceTimestamp: string;
  currency: string;
  amountMinor: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface MarketInput {
  externalId: string;
  symbol: string;
  currency: string;
  priceMinor: number;
  sourceTimestamp: string;
}

export interface IngestionInput {
  provider: string;
  sourceAccountId: string;
  idempotencyKey: string;
  sourceAsOf: string;
  entries: LedgerInput[];
  marketSnapshots?: MarketInput[];
}

function iso(value: string, field: string): string {
  const time = Date.parse(value);
  if (!value || !Number.isFinite(time)) throw new DomainError("invalid_timestamp", `${field} must be an ISO timestamp.`);
  return new Date(time).toISOString();
}

function text(value: string, field: string, max: number): string {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.length > max) throw new DomainError("invalid_field", `${field} is required and must be at most ${max} characters.`);
  return normalized;
}

function integer(value: number, field: string, allowZero = true): number {
  if (!Number.isSafeInteger(value) || (!allowZero && value === 0)) throw new DomainError("invalid_amount", `${field} must be a safe integer${allowZero ? "" : " and non-zero"}.`);
  return value;
}

function transaction<T>(db: Database.Database, work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = work();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function entryCanonical(row: Record<string, unknown>): string {
  return stableJson({
    id: row.id,
    workspaceId: row.workspace_id,
    sourceAccountId: row.source_account_id,
    ingestionRunId: row.ingestion_run_id || null,
    externalId: row.external_id,
    sourceVersion: row.source_version,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    sourceTimestamp: row.source_timestamp,
    receivedAt: row.received_at,
    currency: row.currency,
    amountMinor: row.amount_minor,
    description: row.description,
    originalEntryId: row.original_entry_id || null,
    metadata: JSON.parse(String(row.metadata_json)),
    sourceDigest: row.source_digest,
    previousHash: row.previous_hash || null,
    createdBy: row.created_by,
  });
}

function appendEntry(db: Database.Database, values: {
  sourceAccountId: string;
  ingestionRunId?: string | null;
  externalId: string;
  sourceVersion: number;
  eventType: "transaction" | "corporate_action" | "reversal" | "correction";
  occurredAt: string;
  sourceTimestamp: string;
  receivedAt: string;
  currency: string;
  amountMinor: number;
  description: string;
  originalEntryId?: string | null;
  metadata: Record<string, unknown>;
  sourceDigest: string;
  actor: string;
}): Record<string, unknown> {
  const previous = db.prepare("SELECT entry_hash FROM ledger_entries WHERE workspace_id=? ORDER BY rowid DESC LIMIT 1")
    .get(DEFAULT_WORKSPACE_ID) as { entry_hash: string } | undefined;
  const row: Record<string, unknown> = {
    id: newId("entry"), workspace_id: DEFAULT_WORKSPACE_ID, source_account_id: values.sourceAccountId,
    ingestion_run_id: values.ingestionRunId || null, external_id: values.externalId, source_version: values.sourceVersion,
    event_type: values.eventType, occurred_at: values.occurredAt, source_timestamp: values.sourceTimestamp,
    received_at: values.receivedAt, currency: values.currency, amount_minor: values.amountMinor,
    description: values.description, original_entry_id: values.originalEntryId || null,
    metadata_json: stableJson(values.metadata), source_digest: values.sourceDigest,
    previous_hash: previous?.entry_hash || null, created_by: values.actor,
  };
  row.entry_hash = sha256(entryCanonical(row));
  db.prepare(`INSERT INTO ledger_entries
    (id,workspace_id,source_account_id,ingestion_run_id,external_id,source_version,event_type,occurred_at,source_timestamp,received_at,currency,amount_minor,description,original_entry_id,metadata_json,source_digest,previous_hash,entry_hash,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      String(row.id), String(row.workspace_id), String(row.source_account_id), row.ingestion_run_id ? String(row.ingestion_run_id) : null,
      String(row.external_id), Number(row.source_version), String(row.event_type), String(row.occurred_at), String(row.source_timestamp),
      String(row.received_at), String(row.currency), Number(row.amount_minor), String(row.description),
      row.original_entry_id ? String(row.original_entry_id) : null, String(row.metadata_json), String(row.source_digest),
      row.previous_hash ? String(row.previous_hash) : null, String(row.entry_hash), String(row.created_by),
    );
  return row;
}

export function createSourceAccount(db: Database.Database, actor: string, input: {
  provider: string; externalAccountId: string; displayName: string; currency: string;
  custodyClass: "bank" | "broker"; licenseReference: string;
}, licensedProviders: Set<string>): Record<string, unknown> {
  if (!licensedProviders.has(input.provider)) throw new DomainError("provider_not_licensed", "Provider is not in the approved licensed-provider allowlist.", 403);
  const provider = text(input.provider, "provider", 80);
  const licenseReference = text(input.licenseReference, "licenseReference", 200);
  if (!(["bank", "broker"] as string[]).includes(input.custodyClass)) throw new DomainError("invalid_custody_class", "custodyClass must be bank or broker.");
  const currency = String(input.currency || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new DomainError("invalid_currency", "currency must be a three-letter code.");
  return transaction(db, () => {
    const id = newId("account");
    const now = new Date().toISOString();
    try {
      db.prepare(`INSERT INTO source_accounts
        (id,workspace_id,provider,external_account_id,display_name,currency,custody_class,license_reference,licensed_at,active,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,1,?)`).run(id, DEFAULT_WORKSPACE_ID, provider, text(input.externalAccountId, "externalAccountId", 200),
          text(input.displayName, "displayName", 200), currency, input.custodyClass, licenseReference, now, now);
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new DomainError("duplicate_source_account", "This provider account is already registered.", 409);
      throw error;
    }
    appendAudit(db, actor, "source_account.created", "source_account", id, { provider, custodyClass: input.custodyClass, currency, licenseReference });
    return db.prepare("SELECT * FROM source_accounts WHERE id=?").get(id) as Record<string, unknown>;
  });
}

export function ingest(db: Database.Database, actor: string, input: IngestionInput, licensedProviders: Set<string>, allowManual = false): Record<string, unknown> {
  if (!input || !Array.isArray(input.entries) || (input.marketSnapshots !== undefined && !Array.isArray(input.marketSnapshots))) throw new DomainError("invalid_batch", "entries and marketSnapshots must be arrays.", 400);
  if (!allowManual && !licensedProviders.has(input.provider)) throw new DomainError("provider_not_licensed", "Provider is not approved.", 403);
  if (input.entries.length > 1_000 || (input.marketSnapshots?.length || 0) > 1_000) throw new DomainError("batch_too_large", "At most 1,000 entries and snapshots are accepted per batch.", 413);
  if (input.entries.length === 0 && (input.marketSnapshots?.length || 0) === 0) throw new DomainError("empty_batch", "At least one entry or market snapshot is required.");
  const provider = text(input.provider, "provider", 80);
  const key = text(input.idempotencyKey, "idempotencyKey", 200);
  const sourceAsOf = iso(input.sourceAsOf, "sourceAsOf");
  if (Date.parse(sourceAsOf) > Date.now() + 5 * 60_000) throw new DomainError("future_source_time", "sourceAsOf cannot be more than five minutes in the future.");
  const digest = sha256(stableJson(input));
  return transaction(db, () => {
    const account = db.prepare("SELECT * FROM source_accounts WHERE id=? AND workspace_id=? AND active=1")
      .get(input.sourceAccountId, DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (!account || account.provider !== provider) throw new DomainError("source_account_mismatch", "Active source account does not belong to this provider.", 403);
    if (!allowManual && (!account.license_reference || !account.licensed_at)) throw new DomainError("license_missing", "Source account lacks a license attestation.", 403);
    const existingRun = db.prepare("SELECT * FROM ingestion_runs WHERE workspace_id=? AND provider=? AND idempotency_key=?")
      .get(DEFAULT_WORKSPACE_ID, provider, key) as Record<string, unknown> | undefined;
    if (existingRun) {
      if (existingRun.payload_digest !== digest) throw new DomainError("idempotency_conflict", "Idempotency key was reused with a different payload.", 409);
      return { ...existingRun, duplicateRequest: true };
    }
    const now = new Date().toISOString();
    const runId = newId("ingest");
    db.prepare(`INSERT INTO ingestion_runs
      (id,workspace_id,source_account_id,provider,idempotency_key,source_as_of,received_at,payload_digest,status)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(runId, DEFAULT_WORKSPACE_ID, input.sourceAccountId, provider, key, sourceAsOf, now, digest, "processing");
    let inserted = 0;
    let duplicates = 0;
    let conflicts = 0;
    for (const raw of input.entries) {
      const sourceVersion = raw.sourceVersion ?? 1;
      integer(sourceVersion, "sourceVersion", false);
      if (sourceVersion < 1) throw new DomainError("invalid_source_version", "sourceVersion must be positive.");
      const currency = String(raw.currency || "").toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency) || currency !== account.currency) throw new DomainError("currency_boundary", "Entry currency must match its custody account.");
      const normalized = {
        externalId: text(raw.externalId, "externalId", 200), sourceVersion,
        eventType: raw.eventType || "transaction", occurredAt: iso(raw.occurredAt, "occurredAt"),
        sourceTimestamp: iso(raw.sourceTimestamp, "sourceTimestamp"), currency,
        amountMinor: integer(raw.amountMinor, "amountMinor", false), description: text(raw.description, "description", 500),
        metadata: raw.metadata || {},
      };
      if (Date.parse(normalized.sourceTimestamp) > Date.parse(sourceAsOf) + 5 * 60_000) throw new DomainError("entry_after_source_cutoff", "Entry sourceTimestamp is later than the batch sourceAsOf cutoff.");
      if (!(["transaction", "corporate_action"] as string[]).includes(normalized.eventType)) throw new DomainError("invalid_event_type", "Unsupported ledger event type.");
      const sourceDigest = sha256(stableJson(normalized));
      const existing = db.prepare("SELECT id,source_digest FROM ledger_entries WHERE source_account_id=? AND external_id=? AND source_version=?")
        .get(input.sourceAccountId, normalized.externalId, sourceVersion) as { id: string; source_digest: string } | undefined;
      if (existing) {
        if (existing.source_digest === sourceDigest) duplicates += 1;
        else {
          conflicts += 1;
          db.prepare(`INSERT INTO ingestion_conflicts
            (id,ingestion_run_id,source_account_id,external_id,source_version,existing_digest,incoming_digest,detected_at)
            VALUES(?,?,?,?,?,?,?,?)`).run(newId("conflict"), runId, input.sourceAccountId, normalized.externalId, sourceVersion, existing.source_digest, sourceDigest, now);
        }
        continue;
      }
      appendEntry(db, { sourceAccountId: input.sourceAccountId, ingestionRunId: runId, ...normalized,
        eventType: normalized.eventType as "transaction" | "corporate_action", receivedAt: now, sourceDigest, actor });
      inserted += 1;
    }
    for (const raw of input.marketSnapshots || []) {
      if (account.custody_class !== "broker") throw new DomainError("market_custody_boundary", "Market snapshots require a broker custody source.");
      const symbol = text(String(raw.symbol || "").toUpperCase(), "symbol", 20);
      const currency = String(raw.currency || "").toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new DomainError("invalid_currency", "Market currency must be a three-letter code.");
      const normalized = { externalId: text(raw.externalId, "externalId", 200), symbol, currency,
        priceMinor: integer(raw.priceMinor, "priceMinor", false), sourceTimestamp: iso(raw.sourceTimestamp, "sourceTimestamp") };
      if (Date.parse(normalized.sourceTimestamp) > Date.parse(sourceAsOf) + 5 * 60_000) throw new DomainError("market_after_source_cutoff", "Market sourceTimestamp is later than sourceAsOf.");
      if (normalized.priceMinor < 1) throw new DomainError("invalid_price", "priceMinor must be positive.");
      const sourceDigest = sha256(stableJson(normalized));
      const existing = db.prepare("SELECT source_digest FROM market_snapshots WHERE workspace_id=? AND provider=? AND external_id=?")
        .get(DEFAULT_WORKSPACE_ID, provider, normalized.externalId) as { source_digest: string } | undefined;
      if (existing) {
        if (existing.source_digest !== sourceDigest) throw new DomainError("market_data_conflict", "Market external ID was reused with different content.", 409);
        duplicates += 1;
        continue;
      }
      db.prepare(`INSERT INTO market_snapshots
        (id,workspace_id,provider,symbol,currency,price_minor,external_id,source_timestamp,received_at,source_digest)
        VALUES(?,?,?,?,?,?,?,?,?,?)`).run(newId("market"), DEFAULT_WORKSPACE_ID, provider, symbol, currency, normalized.priceMinor,
          normalized.externalId, normalized.sourceTimestamp, now, sourceDigest);
      inserted += 1;
    }
    const status = conflicts ? "needs_review" : "completed";
    db.prepare("UPDATE ingestion_runs SET status=?,inserted_count=?,duplicate_count=?,conflict_count=? WHERE id=?")
      .run(status, inserted, duplicates, conflicts, runId);
    appendAudit(db, actor, "ingestion.completed", "ingestion_run", runId, { provider, sourceAccountId: input.sourceAccountId, sourceAsOf, inserted, duplicates, conflicts, status });
    return db.prepare("SELECT * FROM ingestion_runs WHERE id=?").get(runId) as Record<string, unknown>;
  });
}

export function appendManualTransaction(db: Database.Database, actor: string, input: LedgerInput & { idempotencyKey: string }): Record<string, unknown> {
  return ingest(db, actor, {
    provider: "manual", sourceAccountId: MANUAL_ACCOUNT_ID, idempotencyKey: input.idempotencyKey,
    sourceAsOf: input.sourceTimestamp, entries: [input],
  }, new Set(), true);
}

export function appendManualImport(db: Database.Database, actor: string, input: { idempotencyKey: string; entries: LedgerInput[] }): Record<string, unknown> {
  if (!Array.isArray(input.entries)) throw new DomainError("invalid_import", "entries must be an array.");
  const sourceAsOf = input.entries.reduce((latest, entry) => entry.sourceTimestamp > latest ? entry.sourceTimestamp : latest, "");
  return ingest(db, actor, {
    provider: "manual", sourceAccountId: MANUAL_ACCOUNT_ID, idempotencyKey: input.idempotencyKey,
    sourceAsOf: sourceAsOf || new Date().toISOString(), entries: input.entries,
  }, new Set(), true);
}

export function correctEntry(db: Database.Database, actor: string, entryId: string, correctionId: string, reason: string, corrected?: Omit<LedgerInput, "externalId" | "sourceVersion" | "eventType">): Record<string, unknown> {
  text(correctionId, "correctionId", 200);
  text(reason, "reason", 500);
  return transaction(db, () => {
    const original = db.prepare("SELECT * FROM ledger_entries WHERE id=? AND workspace_id=?").get(entryId, DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (!original) throw new DomainError("entry_not_found", "Ledger entry was not found.", 404);
    const prior = db.prepare("SELECT * FROM ledger_entries WHERE source_account_id=? AND external_id=?")
      .get(String(original.source_account_id), `${correctionId}:reversal`) as Record<string, unknown> | undefined;
    if (prior) return { duplicateRequest: true, reversalId: prior.id };
    const now = new Date().toISOString();
    const reversalSource = { correctionId, reason, originalHash: original.entry_hash };
    const reversal = appendEntry(db, {
      sourceAccountId: String(original.source_account_id), externalId: `${correctionId}:reversal`, sourceVersion: 1,
      eventType: "reversal", occurredAt: String(original.occurred_at), sourceTimestamp: now, receivedAt: now,
      currency: String(original.currency), amountMinor: -Number(original.amount_minor),
      description: `Reversal: ${String(original.description)}`, originalEntryId: entryId,
      metadata: reversalSource, sourceDigest: sha256(stableJson(reversalSource)), actor,
    });
    let replacement: Record<string, unknown> | null = null;
    if (corrected) {
      const currency = corrected.currency.toUpperCase();
      if (currency !== original.currency) throw new DomainError("currency_boundary", "A correction cannot cross the original custody currency.");
      const replacementSource = { correctionId, reason, corrected };
      replacement = appendEntry(db, {
        sourceAccountId: String(original.source_account_id), externalId: `${correctionId}:replacement`, sourceVersion: 1,
        eventType: "correction", occurredAt: iso(corrected.occurredAt, "occurredAt"), sourceTimestamp: iso(corrected.sourceTimestamp, "sourceTimestamp"), receivedAt: now,
        currency, amountMinor: integer(corrected.amountMinor, "amountMinor", false), description: text(corrected.description, "description", 500),
        originalEntryId: entryId, metadata: { ...(corrected.metadata || {}), correctionReason: reason },
        sourceDigest: sha256(stableJson(replacementSource)), actor,
      });
    }
    appendAudit(db, actor, "ledger.corrected", "ledger_entry", entryId, { correctionId, reason, reversalId: reversal.id, replacementId: replacement?.id || null });
    return { reversalId: reversal.id, replacementId: replacement?.id || null };
  });
}

export function reconcile(db: Database.Database, actor: string, input: {
  sourceAccountId: string; periodStart: string; periodEnd: string; sourceAsOf: string;
  openingBalanceMinor: number; sourceClosingMinor: number;
}): Record<string, unknown> {
  const periodStart = iso(input.periodStart, "periodStart");
  const periodEnd = iso(input.periodEnd, "periodEnd");
  const sourceAsOf = iso(input.sourceAsOf, "sourceAsOf");
  if (periodStart > periodEnd) throw new DomainError("invalid_period", "periodStart must precede periodEnd.");
  return transaction(db, () => {
    const account = db.prepare("SELECT id FROM source_accounts WHERE id=? AND workspace_id=?").get(input.sourceAccountId, DEFAULT_WORKSPACE_ID);
    if (!account) throw new DomainError("account_not_found", "Source account was not found.", 404);
    const sum = db.prepare(`SELECT COALESCE(SUM(amount_minor),0) total FROM ledger_entries
      WHERE source_account_id=? AND occurred_at>=? AND occurred_at<=? AND source_timestamp<=?`)
      .get(input.sourceAccountId, periodStart, periodEnd, sourceAsOf) as { total: number };
    const ledgerChange = Number(sum.total);
    const expected = integer(input.openingBalanceMinor, "openingBalanceMinor") + ledgerChange;
    const discrepancy = integer(input.sourceClosingMinor, "sourceClosingMinor") - expected;
    const status = discrepancy === 0 ? "reconciled" : "exception";
    const id = newId("recon");
    try {
      db.prepare(`INSERT INTO reconciliation_runs
        (id,workspace_id,source_account_id,period_start,period_end,source_as_of,opening_balance_minor,ledger_change_minor,expected_closing_minor,source_closing_minor,discrepancy_minor,status,created_by,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, DEFAULT_WORKSPACE_ID, input.sourceAccountId, periodStart, periodEnd, sourceAsOf,
          input.openingBalanceMinor, ledgerChange, expected, input.sourceClosingMinor, discrepancy, status, actor, new Date().toISOString());
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new DomainError("duplicate_reconciliation", "This exact reconciliation has already been recorded.", 409);
      throw error;
    }
    appendAudit(db, actor, "reconciliation.recorded", "reconciliation", id, { sourceAccountId: input.sourceAccountId, periodStart, periodEnd, sourceAsOf, expected, sourceClosingMinor: input.sourceClosingMinor, discrepancy, status });
    return db.prepare("SELECT * FROM reconciliation_runs WHERE id=?").get(id) as Record<string, unknown>;
  });
}

export function listLedger(db: Database.Database, limit = 200): Record<string, unknown>[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1_000, Math.trunc(limit))) : 200;
  return db.prepare(`SELECT le.*,sa.provider,sa.display_name AS source_name,sa.custody_class
    FROM ledger_entries le JOIN source_accounts sa ON sa.id=le.source_account_id
    WHERE le.workspace_id=? ORDER BY le.occurred_at DESC,le.rowid DESC LIMIT ?`).all(DEFAULT_WORKSPACE_ID, safeLimit) as Record<string, unknown>[];
}

export function auditExport(db: Database.Database): Record<string, unknown> {
  const ledger = db.prepare("SELECT * FROM ledger_entries WHERE workspace_id=? ORDER BY rowid").all(DEFAULT_WORKSPACE_ID) as Record<string, unknown>[];
  const audit = db.prepare("SELECT * FROM audit_events WHERE workspace_id=? ORDER BY rowid").all(DEFAULT_WORKSPACE_ID) as Record<string, unknown>[];
  let previous: string | null = null;
  let ledgerValid = true;
  for (const row of ledger) {
    if ((row.previous_hash || null) !== previous || sha256(entryCanonical(row)) !== row.entry_hash) ledgerValid = false;
    previous = String(row.entry_hash);
  }
  const auditValid = verifyAuditChain(audit);
  return {
    format: "cash-flow-audit-v1", exportedAt: new Date().toISOString(), workspaceId: DEFAULT_WORKSPACE_ID,
    verification: { ledgerHashChain: ledgerValid, auditHashChain: auditValid }, ledger, audit,
    reconciliations: db.prepare("SELECT * FROM reconciliation_runs WHERE workspace_id=? ORDER BY created_at").all(DEFAULT_WORKSPACE_ID),
    ingestionRuns: db.prepare("SELECT * FROM ingestion_runs WHERE workspace_id=? ORDER BY received_at").all(DEFAULT_WORKSPACE_ID),
  };
}
