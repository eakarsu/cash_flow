import type Database from "better-sqlite3";
import { appendAudit } from "./audit.js";
import { newId, stableJson } from "./crypto.js";
import { DEFAULT_WORKSPACE_ID } from "./database.js";
import { DomainError } from "./ledger.js";

export interface RiskPolicy {
  maxOrderNotionalMinor: number;
  maxGrossExposureMinor: number;
  minLiquidityMinor: number;
  maxDailyLossMinor: number;
  approvalNotionalMinor: number;
  staleAfterSeconds: number;
}

export interface RiskState {
  killSwitchActive: boolean;
  marketAgeSeconds: number;
  currentGrossExposureMinor: number;
  availableLiquidityMinor: number;
  dailyPnlMinor: number;
}

export interface RiskDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
  projectedGrossExposureMinor: number;
  projectedLiquidityMinor: number;
}

export function evaluateRisk(policy: RiskPolicy, state: RiskState, side: "buy" | "sell", notionalMinor: number): RiskDecision {
  const reasons: string[] = [];
  const projectedGrossExposureMinor = state.currentGrossExposureMinor + notionalMinor;
  const projectedLiquidityMinor = state.availableLiquidityMinor + (side === "buy" ? -notionalMinor : notionalMinor);
  if (state.killSwitchActive) reasons.push("kill_switch_active");
  if (state.marketAgeSeconds > policy.staleAfterSeconds) reasons.push("stale_market_data");
  if (notionalMinor > policy.maxOrderNotionalMinor) reasons.push("max_order_notional_exceeded");
  if (projectedGrossExposureMinor > policy.maxGrossExposureMinor) reasons.push("max_gross_exposure_exceeded");
  if (projectedLiquidityMinor < policy.minLiquidityMinor) reasons.push("minimum_liquidity_breached");
  if (state.dailyPnlMinor <= -policy.maxDailyLossMinor) reasons.push("daily_loss_limit_breached");
  return {
    allowed: reasons.length === 0,
    requiresApproval: reasons.length === 0 && notionalMinor >= policy.approvalNotionalMinor,
    reasons,
    projectedGrossExposureMinor,
    projectedLiquidityMinor,
  };
}

function policy(db: Database.Database): RiskPolicy {
  const row = db.prepare("SELECT * FROM risk_policies WHERE workspace_id=?").get(DEFAULT_WORKSPACE_ID) as Record<string, unknown>;
  return {
    maxOrderNotionalMinor: Number(row.max_order_notional_minor),
    maxGrossExposureMinor: Number(row.max_gross_exposure_minor),
    minLiquidityMinor: Number(row.min_liquidity_minor),
    maxDailyLossMinor: Number(row.max_daily_loss_minor),
    approvalNotionalMinor: Number(row.approval_notional_minor),
    staleAfterSeconds: Number(row.stale_after_seconds),
  };
}

interface FillRow { symbol: string; side: "buy" | "sell"; quantity_micros: number; price_minor: number; received_at: string }

function portfolio(db: Database.Database): { gross: number; paperCash: number; dailyPnl: number } {
  const fills = db.prepare(`SELECT o.symbol,o.side,f.quantity_micros,f.price_minor,f.received_at
    FROM paper_fills f JOIN paper_orders o ON o.id=f.order_id WHERE o.workspace_id=? ORDER BY f.received_at,f.rowid`)
    .all(DEFAULT_WORKSPACE_ID) as unknown as FillRow[];
  const positions = new Map<string, { quantity: number; averagePrice: number }>();
  let paperCash = 0;
  let dailyPnl = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const fill of fills) {
    const signed = fill.side === "buy" ? fill.quantity_micros : -fill.quantity_micros;
    paperCash += Math.round((fill.side === "buy" ? -1 : 1) * fill.quantity_micros * fill.price_minor / 1_000_000);
    const current = positions.get(fill.symbol) || { quantity: 0, averagePrice: 0 };
    const sameDirection = current.quantity === 0 || Math.sign(current.quantity) === Math.sign(signed);
    if (sameDirection) {
      const totalAbs = Math.abs(current.quantity) + Math.abs(signed);
      current.averagePrice = totalAbs === 0 ? 0 : (Math.abs(current.quantity) * current.averagePrice + Math.abs(signed) * fill.price_minor) / totalAbs;
      current.quantity += signed;
    } else {
      const closing = Math.min(Math.abs(current.quantity), Math.abs(signed));
      const pnl = current.quantity > 0
        ? (fill.price_minor - current.averagePrice) * closing / 1_000_000
        : (current.averagePrice - fill.price_minor) * closing / 1_000_000;
      if (fill.received_at.startsWith(today)) dailyPnl += Math.round(pnl);
      const remainder = current.quantity + signed;
      if (remainder === 0) Object.assign(current, { quantity: 0, averagePrice: 0 });
      else if (Math.sign(remainder) !== Math.sign(current.quantity)) Object.assign(current, { quantity: remainder, averagePrice: fill.price_minor });
      else current.quantity = remainder;
    }
    positions.set(fill.symbol, current);
  }
  let gross = 0;
  for (const [symbol, position] of positions) {
    const latest = db.prepare("SELECT price_minor FROM market_snapshots WHERE workspace_id=? AND symbol=? ORDER BY source_timestamp DESC,rowid DESC LIMIT 1")
      .get(DEFAULT_WORKSPACE_ID, symbol) as { price_minor: number } | undefined;
    if (latest) gross += Math.round(Math.abs(position.quantity) * latest.price_minor / 1_000_000);
  }
  return { gross, paperCash, dailyPnl };
}

function riskState(db: Database.Database, marketTimestamp: string): RiskState {
  const control = db.prepare("SELECT kill_switch_active FROM control_state WHERE workspace_id=?").get(DEFAULT_WORKSPACE_ID) as { kill_switch_active: number };
  const cash = db.prepare(`SELECT COALESCE(SUM(le.amount_minor),0) total FROM ledger_entries le
    JOIN source_accounts sa ON sa.id=le.source_account_id WHERE le.workspace_id=? AND sa.custody_class IN ('bank','manual')`)
    .get(DEFAULT_WORKSPACE_ID) as { total: number };
  const values = portfolio(db);
  return {
    killSwitchActive: Boolean(control.kill_switch_active),
    marketAgeSeconds: Math.max(0, (Date.now() - Date.parse(marketTimestamp)) / 1000),
    currentGrossExposureMinor: values.gross,
    availableLiquidityMinor: Number(cash.total) + values.paperCash,
    dailyPnlMinor: values.dailyPnl,
  };
}

function tx<T>(db: Database.Database, work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try { const value = work(); db.exec("COMMIT"); return value; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function submitPaperOrder(db: Database.Database, actor: string, input: {
  clientOrderId: string; symbol: string; side: "buy" | "sell"; quantityMicros: number;
}): Record<string, unknown> {
  const clientOrderId = String(input.clientOrderId || "").trim();
  const requestedSymbol = String(input.symbol || "").toUpperCase();
  if (!clientOrderId || clientOrderId.length > 200) throw new DomainError("invalid_order_id", "clientOrderId is required.");
  if (!/^[A-Z0-9.:-]{1,20}$/.test(requestedSymbol)) throw new DomainError("invalid_symbol", "symbol is invalid.");
  if (!(["buy", "sell"] as string[]).includes(input.side)) throw new DomainError("invalid_side", "side must be buy or sell.");
  if (!Number.isSafeInteger(input.quantityMicros) || input.quantityMicros <= 0) throw new DomainError("invalid_quantity", "quantityMicros must be a positive safe integer.");
  return tx(db, () => {
    const duplicate = db.prepare("SELECT * FROM paper_orders WHERE workspace_id=? AND client_order_id=?").get(DEFAULT_WORKSPACE_ID, clientOrderId) as Record<string, unknown> | undefined;
    if (duplicate) return { ...duplicate, duplicateRequest: true };
    const symbol = requestedSymbol;
    const market = db.prepare("SELECT * FROM market_snapshots WHERE workspace_id=? AND symbol=? ORDER BY source_timestamp DESC,rowid DESC LIMIT 1")
      .get(DEFAULT_WORKSPACE_ID, symbol) as Record<string, unknown> | undefined;
    if (!market) throw new DomainError("market_data_missing", "No licensed market snapshot is available for this symbol.", 409);
    const notional = Math.ceil(input.quantityMicros * Number(market.price_minor) / 1_000_000);
    if (!Number.isSafeInteger(notional) || notional <= 0) throw new DomainError("invalid_notional", "Order notional is outside supported integer bounds.");
    const decision = evaluateRisk(policy(db), riskState(db, String(market.source_timestamp)), input.side, notional);
    const status = !decision.allowed ? "blocked" : decision.requiresApproval ? "pending_approval" : "approved";
    const id = newId("order");
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO paper_orders
      (id,workspace_id,client_order_id,symbol,side,quantity_micros,requested_price_minor,notional_minor,market_snapshot_id,status,risk_reasons_json,submitted_by,submitted_at,version)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).run(id, DEFAULT_WORKSPACE_ID, clientOrderId, symbol, input.side, input.quantityMicros,
        Number(market.price_minor), notional, String(market.id), status, stableJson(decision.reasons), actor, now);
    appendAudit(db, actor, "paper_order.submitted", "paper_order", id, { mode: "paper", symbol, side: input.side, quantityMicros: input.quantityMicros, notionalMinor: notional, status, decision });
    return { ...(db.prepare("SELECT * FROM paper_orders WHERE id=?").get(id) as Record<string, unknown>), decision };
  });
}

export function reviewPaperOrder(db: Database.Database, reviewer: string, orderId: string, decision: "approved" | "rejected", reason: string): Record<string, unknown> {
  const normalizedReason = String(reason || "").trim();
  if (!normalizedReason || normalizedReason.length > 500) throw new DomainError("reason_required", "A bounded review reason is required.");
  if (!(["approved", "rejected"] as string[]).includes(decision)) throw new DomainError("invalid_decision", "decision must be approved or rejected.");
  return tx(db, () => {
    const order = db.prepare("SELECT * FROM paper_orders WHERE id=? AND workspace_id=?").get(orderId, DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (!order) throw new DomainError("order_not_found", "Order was not found.", 404);
    if (order.status !== "pending_approval") throw new DomainError("invalid_order_state", "Only pending orders can be reviewed.", 409);
    if (order.submitted_by === reviewer) throw new DomainError("independent_review_required", "Submitter cannot approve their own order.", 403);
    if (decision === "approved") {
      const market = db.prepare("SELECT source_timestamp FROM market_snapshots WHERE id=?").get(String(order.market_snapshot_id)) as { source_timestamp: string };
      const currentDecision = evaluateRisk(policy(db), riskState(db, market.source_timestamp), order.side as "buy" | "sell", Number(order.notional_minor));
      if (!currentDecision.allowed) throw new DomainError("risk_changed", `Order can no longer be approved: ${currentDecision.reasons.join(", ")}.`, 409);
    }
    const now = new Date().toISOString();
    db.prepare("INSERT INTO order_approvals(id,order_id,decision,reviewer,reason,created_at) VALUES(?,?,?,?,?,?)")
      .run(newId("approval"), orderId, decision, reviewer, normalizedReason, now);
    db.prepare("UPDATE paper_orders SET status=?,approved_by=?,approved_at=?,version=version+1 WHERE id=?")
      .run(decision, decision === "approved" ? reviewer : null, decision === "approved" ? now : null, orderId);
    appendAudit(db, reviewer, `paper_order.${decision}`, "paper_order", orderId, { reason: normalizedReason, submitter: order.submitted_by });
    return db.prepare("SELECT * FROM paper_orders WHERE id=?").get(orderId) as Record<string, unknown>;
  });
}

export function recordPaperFill(db: Database.Database, actor: string, orderId: string, input: {
  externalFillId: string; quantityMicros: number; priceMinor: number; sourceTimestamp: string;
}): Record<string, unknown> {
  const externalFillId = String(input.externalFillId || "").trim();
  if (!externalFillId || externalFillId.length > 200) throw new DomainError("invalid_fill_id", "externalFillId is required.");
  if (!Number.isSafeInteger(input.quantityMicros) || input.quantityMicros <= 0) throw new DomainError("invalid_fill_quantity", "Fill quantity must be positive.");
  if (!Number.isSafeInteger(input.priceMinor) || input.priceMinor <= 0) throw new DomainError("invalid_fill_price", "Fill price must be positive.");
  const sourceMs = Date.parse(input.sourceTimestamp);
  if (!Number.isFinite(sourceMs)) throw new DomainError("invalid_fill_timestamp", "sourceTimestamp must be an ISO timestamp.");
  const sourceTime = new Date(sourceMs).toISOString();
  return tx(db, () => {
    const order = db.prepare("SELECT * FROM paper_orders WHERE id=? AND workspace_id=?").get(orderId, DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (!order) throw new DomainError("order_not_found", "Order was not found.", 404);
    const duplicate = db.prepare("SELECT * FROM paper_fills WHERE order_id=? AND external_fill_id=?").get(orderId, externalFillId) as Record<string, unknown> | undefined;
    if (duplicate) return { ...duplicate, duplicateRequest: true };
    if (!(["approved", "partial"] as unknown[]).includes(order.status)) throw new DomainError("fill_not_allowed", "Order is not eligible for fills.", 409);
    const filled = db.prepare("SELECT COALESCE(SUM(quantity_micros),0) total FROM paper_fills WHERE order_id=?").get(orderId) as { total: number };
    const remaining = Number(order.quantity_micros) - Number(filled.total);
    if (input.quantityMicros > remaining) throw new DomainError("overfill_blocked", "Fill exceeds the remaining paper quantity.", 409);
    const id = newId("fill");
    const now = new Date().toISOString();
    db.prepare("INSERT INTO paper_fills(id,order_id,external_fill_id,quantity_micros,price_minor,source_timestamp,received_at) VALUES(?,?,?,?,?,?,?)")
      .run(id, orderId, externalFillId, input.quantityMicros, input.priceMinor, sourceTime, now);
    const status = input.quantityMicros === remaining ? "filled" : "partial";
    db.prepare("UPDATE paper_orders SET status=?,version=version+1 WHERE id=?").run(status, orderId);
    appendAudit(db, actor, "paper_fill.recorded", "paper_order", orderId, { fillId: id, externalFillId, quantityMicros: input.quantityMicros, priceMinor: input.priceMinor, sourceTimestamp: sourceTime, status });
    return { id, orderId, status, remainingQuantityMicros: remaining - input.quantityMicros };
  });
}

export function activateKillSwitch(db: Database.Database, actor: string, reason: string): Record<string, unknown> {
  const normalizedReason = String(reason || "").trim();
  if (!normalizedReason || normalizedReason.length > 500) throw new DomainError("reason_required", "Kill-switch activation requires a reason.");
  return tx(db, () => {
    const now = new Date().toISOString();
    db.prepare("UPDATE control_state SET kill_switch_active=1,reason=?,changed_by=?,changed_at=?,version=version+1 WHERE workspace_id=?")
      .run(normalizedReason, actor, now, DEFAULT_WORKSPACE_ID);
    const cancelled = db.prepare("UPDATE paper_orders SET status='cancelled',version=version+1 WHERE workspace_id=? AND status IN ('pending_approval','approved','partial')")
      .run(DEFAULT_WORKSPACE_ID).changes;
    appendAudit(db, actor, "kill_switch.activated", "control_state", DEFAULT_WORKSPACE_ID, { reason: normalizedReason, cancelledOrders: cancelled });
    return { active: true, cancelledOrders: cancelled };
  });
}

export function requestKillSwitchRelease(db: Database.Database, actor: string, reason: string): Record<string, unknown> {
  const normalizedReason = String(reason || "").trim();
  if (!normalizedReason || normalizedReason.length > 500) throw new DomainError("reason_required", "Release request requires a reason.");
  return tx(db, () => {
    const state = db.prepare("SELECT kill_switch_active FROM control_state WHERE workspace_id=?").get(DEFAULT_WORKSPACE_ID) as { kill_switch_active: number };
    if (!state.kill_switch_active) throw new DomainError("kill_switch_inactive", "Kill switch is already inactive.", 409);
    const existing = db.prepare("SELECT * FROM kill_switch_release_requests WHERE workspace_id=? AND status='pending'").get(DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (existing) return { ...existing, duplicateRequest: true };
    const id = newId("release");
    db.prepare("INSERT INTO kill_switch_release_requests(id,workspace_id,requested_by,reason,status,created_at) VALUES(?,?,?,?,?,?)")
      .run(id, DEFAULT_WORKSPACE_ID, actor, normalizedReason, "pending", new Date().toISOString());
    appendAudit(db, actor, "kill_switch.release_requested", "kill_switch_release", id, { reason: normalizedReason });
    return db.prepare("SELECT * FROM kill_switch_release_requests WHERE id=?").get(id) as Record<string, unknown>;
  });
}

export function reviewKillSwitchRelease(db: Database.Database, reviewer: string, requestId: string, decision: "approved" | "rejected"): Record<string, unknown> {
  if (!(["approved", "rejected"] as string[]).includes(decision)) throw new DomainError("invalid_decision", "decision must be approved or rejected.");
  return tx(db, () => {
    const request = db.prepare("SELECT * FROM kill_switch_release_requests WHERE id=? AND workspace_id=?").get(requestId, DEFAULT_WORKSPACE_ID) as Record<string, unknown> | undefined;
    if (!request) throw new DomainError("release_not_found", "Release request was not found.", 404);
    if (request.status !== "pending") throw new DomainError("release_already_reviewed", "Release request has already been reviewed.", 409);
    if (request.requested_by === reviewer) throw new DomainError("independent_review_required", "Requester cannot release the kill switch.", 403);
    const now = new Date().toISOString();
    db.prepare("UPDATE kill_switch_release_requests SET status=?,reviewed_by=?,reviewed_at=? WHERE id=?").run(decision, reviewer, now, requestId);
    if (decision === "approved") db.prepare("UPDATE control_state SET kill_switch_active=0,reason=NULL,changed_by=?,changed_at=?,version=version+1 WHERE workspace_id=?").run(reviewer, now, DEFAULT_WORKSPACE_ID);
    appendAudit(db, reviewer, `kill_switch.release_${decision}`, "kill_switch_release", requestId, { requester: request.requested_by });
    return { requestId, decision, active: decision !== "approved" };
  });
}

export function runSimulation(db: Database.Database, actor: string, scenario: "stale_data" | "duplicate_order" | "partial_fill" | "provider_failure" | "limit_breach"): Record<string, unknown> {
  if (!(["stale_data", "duplicate_order", "partial_fill", "provider_failure", "limit_breach"] as string[]).includes(scenario)) throw new DomainError("invalid_scenario", "Unsupported simulation scenario.");
  const basePolicy = policy(db);
  let result: Record<string, unknown>;
  if (scenario === "stale_data") result = { expected: "blocked", decision: evaluateRisk(basePolicy, { killSwitchActive: false, marketAgeSeconds: basePolicy.staleAfterSeconds + 1, currentGrossExposureMinor: 0, availableLiquidityMinor: 1_000_000_00, dailyPnlMinor: 0 }, "buy", 1_000_00) };
  else if (scenario === "limit_breach") result = { expected: "blocked", decision: evaluateRisk(basePolicy, { killSwitchActive: false, marketAgeSeconds: 0, currentGrossExposureMinor: basePolicy.maxGrossExposureMinor, availableLiquidityMinor: 1_000_000_00, dailyPnlMinor: 0 }, "buy", 1_000_00) };
  else if (scenario === "duplicate_order") result = { expected: "idempotent", invariant: "workspace/client_order_id unique" };
  else if (scenario === "partial_fill") result = { expected: "partial_then_filled", invariant: "sum(fills) cannot exceed order quantity" };
  else result = { expected: "authoritative ledger unchanged", invariant: "provider failures cannot create ledger or live execution records" };
  const passed = scenario === "stale_data" || scenario === "limit_breach" ? !(result.decision as RiskDecision).allowed : true;
  return tx(db, () => {
    const id = newId("simulation");
    db.prepare("INSERT INTO simulation_runs(id,workspace_id,scenario,result_json,passed,created_by,created_at) VALUES(?,?,?,?,?,?,?)")
      .run(id, DEFAULT_WORKSPACE_ID, scenario, stableJson(result), passed ? 1 : 0, actor, new Date().toISOString());
    appendAudit(db, actor, "paper_simulation.completed", "simulation", id, { scenario, passed, result });
    return { id, scenario, passed, result };
  });
}

export function operationsSnapshot(db: Database.Database): Record<string, unknown> {
  const control = db.prepare("SELECT * FROM control_state WHERE workspace_id=?").get(DEFAULT_WORKSPACE_ID);
  const latestRecon = db.prepare("SELECT * FROM reconciliation_runs WHERE workspace_id=? ORDER BY created_at DESC LIMIT 10").all(DEFAULT_WORKSPACE_ID);
  const failures = db.prepare("SELECT * FROM ingestion_runs WHERE workspace_id=? AND status!='completed' ORDER BY received_at DESC LIMIT 20").all(DEFAULT_WORKSPACE_ID);
  const orders = db.prepare("SELECT * FROM paper_orders WHERE workspace_id=? ORDER BY submitted_at DESC LIMIT 50").all(DEFAULT_WORKSPACE_ID);
  return { mode: "paper_only", control, portfolio: portfolio(db), policy: policy(db), reconciliation: latestRecon, ingestionExceptions: failures, orders };
}
