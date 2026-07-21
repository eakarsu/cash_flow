export interface RuntimeConfig {
  databasePath: string;
  publicAppUrl: string;
  operatorToken: string;
  auditorToken: string;
  providerSecret: string;
  identityHashSecret: string;
  licensedProviders: Set<string>;
  production: boolean;
}

function strong(name: string, value: string | undefined, production: boolean): string {
  if (value && value.length >= 32) return value;
  if (production) throw new Error(`${name} must be at least 32 characters in production.`);
  return value || `development-${name.toLowerCase()}-0123456789abcdef`;
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const production = env.NODE_ENV === "production";
  if (env.LIVE_TRADING_ENABLED === "true") {
    throw new Error("Live trading is not implemented. LIVE_TRADING_ENABLED must remain false.");
  }
  const publicAppUrl = env.PUBLIC_APP_URL || "http://127.0.0.1:3001";
  if (production && !publicAppUrl.startsWith("https://")) throw new Error("PUBLIC_APP_URL must use HTTPS in production.");
  const databasePath = env.LEDGER_DATABASE_PATH || env.DB_PATH || "data/cash-flow.sqlite";
  if (production && databasePath === ":memory:") throw new Error("Production ledger cannot use an in-memory database.");
  const operatorToken = strong("OPERATOR_API_TOKEN", env.OPERATOR_API_TOKEN, production);
  const auditorToken = strong("AUDITOR_API_TOKEN", env.AUDITOR_API_TOKEN, production);
  const providerSecret = strong("PROVIDER_WEBHOOK_SECRET", env.PROVIDER_WEBHOOK_SECRET, production);
  const identityHashSecret = strong("IDENTITY_HASH_SECRET", env.IDENTITY_HASH_SECRET, production);
  const secrets = new Set([operatorToken, auditorToken, providerSecret, identityHashSecret]);
  if (secrets.size !== 4) throw new Error("Runtime secrets must be distinct.");
  const licensedProviders = new Set((env.LICENSED_PROVIDERS || (production ? "" : "test-bank,test-broker"))
    .split(",").map((value) => value.trim()).filter(Boolean));
  if (production && licensedProviders.size === 0) throw new Error("LICENSED_PROVIDERS must name approved providers.");
  return { databasePath, publicAppUrl, operatorToken, auditorToken, providerSecret, identityHashSecret, licensedProviders, production };
}
