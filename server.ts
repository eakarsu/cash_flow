import "dotenv/config";
import { createApp } from "./src/server/app.js";
import { readRuntimeConfig } from "./src/server/config.js";
import { openDatabase } from "./src/server/database.js";

const config = readRuntimeConfig();
const autoMigrate = !config.production && process.env.AUTO_MIGRATE !== "false";
const database = openDatabase(config.databasePath, { migrate: autoMigrate, initialize: true });
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT is invalid.");

const server = createApp(database, config).listen(port, "0.0.0.0", () => {
  console.log(`Cash Flow Manager listening on port ${port} in paper-only mode.`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}; stopping.`);
  server.close(() => { database.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
