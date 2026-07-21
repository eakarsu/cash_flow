import "dotenv/config";
import { readRuntimeConfig } from "../src/server/config.js";
import { migrateDatabase } from "../src/server/database.js";

const config = readRuntimeConfig();
migrateDatabase(config.databasePath);
console.log("Ledger migrations applied successfully.");
