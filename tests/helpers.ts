import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { openDatabase } from "../src/server/database.js";

export function testDatabase(): { db: Database.Database; cleanup: () => void } {
  const directory = mkdtempSync(join(tmpdir(), "cash-flow-test-"));
  const db = openDatabase(join(directory, "ledger.sqlite"), { migrate: true, initialize: true });
  return { db, cleanup: () => { db.close(); rmSync(directory, { recursive: true, force: true }); } };
}
