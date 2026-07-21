import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

export const DEFAULT_WORKSPACE_ID = "workspace_default";
export const MANUAL_ACCOUNT_ID = "account_manual";

export interface OpenDatabaseOptions {
  migrate?: boolean;
  initialize?: boolean;
}

function applyMigrations(db: Database.Database): void {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT;");
  const directory = resolve(process.cwd(), "migrations");
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = readFileSync(resolve(directory, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = db.prepare("SELECT checksum FROM schema_migrations WHERE version = ?").get(file) as { checksum: string } | undefined;
    if (existing) {
      if (existing.checksum !== checksum) throw new Error(`Applied migration ${file} has changed.`);
      continue;
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations(version, checksum, applied_at) VALUES(?,?,?)").run(file, checksum, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

function initializeDefaults(db: Database.Database): void {
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO workspaces(id,name,created_at) VALUES(?,?,?)")
    .run(DEFAULT_WORKSPACE_ID, "Primary cash operations", now);
  db.prepare(`INSERT OR IGNORE INTO source_accounts
    (id,workspace_id,provider,external_account_id,display_name,currency,custody_class,active,created_at)
    VALUES(?,?,?,?,?,?,?,1,?)`)
    .run(MANUAL_ACCOUNT_ID, DEFAULT_WORKSPACE_ID, "manual", "manual-ledger", "Manual controlled entries", "USD", "manual", now);
  db.prepare(`INSERT OR IGNORE INTO risk_policies
    (workspace_id,max_order_notional_minor,max_gross_exposure_minor,min_liquidity_minor,max_daily_loss_minor,approval_notional_minor,stale_after_seconds,version,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(DEFAULT_WORKSPACE_ID, 100_000_00, 500_000_00, 25_000_00, 20_000_00, 25_000_00, 300, 1, now);
  db.prepare(`INSERT OR IGNORE INTO control_state
    (workspace_id,kill_switch_active,reason,changed_by,changed_at,version) VALUES(?,0,NULL,?,?,1)`)
    .run(DEFAULT_WORKSPACE_ID, "system", now);
}

export function openDatabase(path: string, options: OpenDatabaseOptions = {}): Database.Database {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 });
  const db = new Database(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;");
  if (options.migrate) applyMigrations(db);
  if (options.initialize) initializeDefaults(db);
  return db;
}

export function migrateDatabase(path: string): void {
  const db = openDatabase(path, { migrate: true, initialize: true });
  db.close();
}
