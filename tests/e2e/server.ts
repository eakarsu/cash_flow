import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { bootstrapUser } from "../../src/server/auth.js";
import { createApp } from "../../src/server/app.js";
import type { RuntimeConfig } from "../../src/server/config.js";
import { openDatabase } from "../../src/server/database.js";

const directory = resolve(process.cwd(), "test-results");
const databasePath = resolve(directory, "cash-flow-e2e.sqlite");
if (!databasePath.includes(`${resolve(process.cwd(), "test-results")}/cash-flow-e2e.sqlite`)) throw new Error("Unsafe E2E database path.");
mkdirSync(directory, { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) rmSync(`${databasePath}${suffix}`, { force: true });

const config: RuntimeConfig = {
  databasePath, publicAppUrl: "http://127.0.0.1:3218", production: false,
  operatorToken: "test-operator-token",
  auditorToken: "test-auditor-token",
  providerSecret: "test-provider-secret",
  identityHashSecret: "test-identity-secret",
  licensedProviders: new Set(["licensed-bank"]),
};
const database = openDatabase(databasePath, { migrate: true, initialize: true });
bootstrapUser(database, { email: "operator@example.test", password: "correct-horse-battery-staple", role: "operator" });
const server = createApp(database, config).listen(3218, "127.0.0.1", () => console.log("E2E server ready"));
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.close(() => { database.close(); process.exit(0); }));
