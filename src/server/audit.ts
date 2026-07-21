import type Database from "better-sqlite3";
import { newId, sha256, stableJson } from "./crypto.js";
import { DEFAULT_WORKSPACE_ID } from "./database.js";

export function appendAudit(
  db: Database.Database,
  actor: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
  occurredAt = new Date().toISOString(),
): string {
  const previous = db.prepare("SELECT event_hash FROM audit_events WHERE workspace_id=? ORDER BY rowid DESC LIMIT 1")
    .get(DEFAULT_WORKSPACE_ID) as { event_hash: string } | undefined;
  const id = newId("audit");
  const canonical = stableJson({ id, workspaceId: DEFAULT_WORKSPACE_ID, actor, action, entityType, entityId, details, occurredAt, previousHash: previous?.event_hash || null });
  const hash = sha256(canonical);
  db.prepare(`INSERT INTO audit_events
    (id,workspace_id,actor,action,entity_type,entity_id,details_json,occurred_at,previous_hash,event_hash)
    VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .run(id, DEFAULT_WORKSPACE_ID, actor, action, entityType, entityId, stableJson(details), occurredAt, previous?.event_hash || null, hash);
  return id;
}

export function verifyAuditChain(rows: Record<string, unknown>[]): boolean {
  let previous: string | null = null;
  for (const row of rows) {
    if ((row.previous_hash || null) !== previous) return false;
    const details = JSON.parse(String(row.details_json));
    const canonical = stableJson({
      id: row.id,
      workspaceId: row.workspace_id,
      actor: row.actor,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details,
      occurredAt: row.occurred_at,
      previousHash: row.previous_hash || null,
    });
    if (sha256(canonical) !== row.event_hash) return false;
    previous = String(row.event_hash);
  }
  return true;
}
