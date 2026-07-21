import "dotenv/config";
import { bootstrapUser } from "../src/server/auth.js";
import { readRuntimeConfig } from "../src/server/config.js";
import { openDatabase } from "../src/server/database.js";

const config = readRuntimeConfig();
const email = process.env.BOOTSTRAP_EMAIL;
const password = process.env.BOOTSTRAP_PASSWORD;
const role = process.env.BOOTSTRAP_ROLE === "auditor" ? "auditor" : "operator";
if (!email || !password) throw new Error("BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD are required.");
const database = openDatabase(config.databasePath, { initialize: true });
try {
  const id = bootstrapUser(database, { email, password, role });
  console.log(`Created ${role} user ${id}. Credentials were not printed.`);
} finally {
  database.close();
}
