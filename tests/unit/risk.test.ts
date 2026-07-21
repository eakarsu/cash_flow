import { describe, expect, it } from "vitest";
import { readRuntimeConfig } from "../../src/server/config.js";
import { evaluateRisk, type RiskPolicy } from "../../src/server/risk.js";

const policy: RiskPolicy = {
  maxOrderNotionalMinor: 10_000,
  maxGrossExposureMinor: 50_000,
  minLiquidityMinor: 5_000,
  maxDailyLossMinor: 2_000,
  approvalNotionalMinor: 7_500,
  staleAfterSeconds: 60,
};

describe("deterministic risk controls", () => {
  it("requires independent approval without delegating a decision to AI", () => {
    const decision = evaluateRisk(policy, { killSwitchActive: false, marketAgeSeconds: 5, currentGrossExposureMinor: 0, availableLiquidityMinor: 30_000, dailyPnlMinor: 0 }, "buy", 8_000);
    expect(decision).toMatchObject({ allowed: true, requiresApproval: true, reasons: [] });
  });

  it.each([
    ["kill switch", { killSwitchActive: true, marketAgeSeconds: 0, currentGrossExposureMinor: 0, availableLiquidityMinor: 30_000, dailyPnlMinor: 0 }, "kill_switch_active"],
    ["stale data", { killSwitchActive: false, marketAgeSeconds: 61, currentGrossExposureMinor: 0, availableLiquidityMinor: 30_000, dailyPnlMinor: 0 }, "stale_market_data"],
    ["daily loss", { killSwitchActive: false, marketAgeSeconds: 0, currentGrossExposureMinor: 0, availableLiquidityMinor: 30_000, dailyPnlMinor: -2_000 }, "daily_loss_limit_breached"],
  ])("blocks %s", (_name, state, reason) => {
    expect(evaluateRisk(policy, state, "buy", 1_000).reasons).toContain(reason);
  });

  it("fails startup closed for live trading or reused production secrets", () => {
    expect(() => readRuntimeConfig({ NODE_ENV: "production", LIVE_TRADING_ENABLED: "true" })).toThrow(/Live trading/);
    const shared = "a".repeat(40);
    expect(() => readRuntimeConfig({ NODE_ENV: "production", PUBLIC_APP_URL: "https://cash.example", LEDGER_DATABASE_PATH: "/data/ledger.sqlite", OPERATOR_API_TOKEN: shared, AUDITOR_API_TOKEN: shared, PROVIDER_WEBHOOK_SECRET: "b".repeat(40), IDENTITY_HASH_SECRET: "c".repeat(40), LICENSED_PROVIDERS: "bank" })).toThrow(/distinct/);
  });
});
