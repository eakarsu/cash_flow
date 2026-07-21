CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator','auditor')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE auth_attempts (
  identity_hash TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  window_started_at TEXT NOT NULL,
  locked_until TEXT
) STRICT;

CREATE TABLE source_accounts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  external_account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  custody_class TEXT NOT NULL CHECK (custody_class IN ('bank','broker','manual')),
  license_reference TEXT,
  licensed_at TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, provider, external_account_id)
) STRICT;

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  source_account_id TEXT NOT NULL REFERENCES source_accounts(id),
  provider TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_as_of TEXT NOT NULL,
  received_at TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','needs_review','failed')),
  inserted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  UNIQUE(workspace_id, provider, idempotency_key)
) STRICT;

CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  source_account_id TEXT NOT NULL REFERENCES source_accounts(id),
  ingestion_run_id TEXT REFERENCES ingestion_runs(id),
  external_id TEXT NOT NULL,
  source_version INTEGER NOT NULL CHECK (source_version > 0),
  event_type TEXT NOT NULL CHECK (event_type IN ('transaction','corporate_action','reversal','correction')),
  occurred_at TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  received_at TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  amount_minor INTEGER NOT NULL,
  description TEXT NOT NULL,
  original_entry_id TEXT REFERENCES ledger_entries(id),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  source_digest TEXT NOT NULL,
  previous_hash TEXT,
  entry_hash TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  UNIQUE(source_account_id, external_id, source_version)
) STRICT;

CREATE TABLE ingestion_conflicts (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_runs(id),
  source_account_id TEXT NOT NULL REFERENCES source_accounts(id),
  external_id TEXT NOT NULL,
  source_version INTEGER NOT NULL,
  existing_digest TEXT NOT NULL,
  incoming_digest TEXT NOT NULL,
  detected_at TEXT NOT NULL
) STRICT;

CREATE TABLE market_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  provider TEXT NOT NULL,
  symbol TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  price_minor INTEGER NOT NULL CHECK (price_minor > 0),
  external_id TEXT NOT NULL,
  source_timestamp TEXT NOT NULL,
  received_at TEXT NOT NULL,
  source_digest TEXT NOT NULL,
  UNIQUE(workspace_id, provider, external_id)
) STRICT;

CREATE TABLE reconciliation_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  source_account_id TEXT NOT NULL REFERENCES source_accounts(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  source_as_of TEXT NOT NULL,
  opening_balance_minor INTEGER NOT NULL,
  ledger_change_minor INTEGER NOT NULL,
  expected_closing_minor INTEGER NOT NULL,
  source_closing_minor INTEGER NOT NULL,
  discrepancy_minor INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reconciled','exception')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(source_account_id, period_start, period_end, source_as_of)
) STRICT;

CREATE TABLE risk_policies (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  max_order_notional_minor INTEGER NOT NULL CHECK (max_order_notional_minor > 0),
  max_gross_exposure_minor INTEGER NOT NULL CHECK (max_gross_exposure_minor > 0),
  min_liquidity_minor INTEGER NOT NULL CHECK (min_liquidity_minor >= 0),
  max_daily_loss_minor INTEGER NOT NULL CHECK (max_daily_loss_minor > 0),
  approval_notional_minor INTEGER NOT NULL CHECK (approval_notional_minor > 0),
  stale_after_seconds INTEGER NOT NULL CHECK (stale_after_seconds BETWEEN 1 AND 86400),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE control_state (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id),
  kill_switch_active INTEGER NOT NULL DEFAULT 0 CHECK (kill_switch_active IN (0,1)),
  reason TEXT,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
) STRICT;

CREATE TABLE kill_switch_release_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  requested_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
) STRICT;

CREATE TABLE paper_orders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  client_order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  quantity_micros INTEGER NOT NULL CHECK (quantity_micros > 0),
  requested_price_minor INTEGER NOT NULL CHECK (requested_price_minor > 0),
  notional_minor INTEGER NOT NULL CHECK (notional_minor > 0),
  market_snapshot_id TEXT NOT NULL REFERENCES market_snapshots(id),
  status TEXT NOT NULL CHECK (status IN ('blocked','pending_approval','approved','partial','filled','cancelled','rejected')),
  risk_reasons_json TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(workspace_id, client_order_id)
) STRICT;

CREATE TABLE order_approvals (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES paper_orders(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  reviewer TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(order_id, reviewer)
) STRICT;

CREATE TABLE paper_fills (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES paper_orders(id),
  external_fill_id TEXT NOT NULL,
  quantity_micros INTEGER NOT NULL CHECK (quantity_micros > 0),
  price_minor INTEGER NOT NULL CHECK (price_minor > 0),
  source_timestamp TEXT NOT NULL,
  received_at TEXT NOT NULL,
  UNIQUE(order_id, external_fill_id)
) STRICT;

CREATE TABLE simulation_runs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  scenario TEXT NOT NULL CHECK (scenario IN ('stale_data','duplicate_order','partial_fill','provider_failure','limit_breach')),
  result_json TEXT NOT NULL,
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL UNIQUE
) STRICT;

CREATE INDEX idx_ledger_workspace_time ON ledger_entries(workspace_id, occurred_at, id);
CREATE INDEX idx_ledger_account_time ON ledger_entries(source_account_id, occurred_at);
CREATE INDEX idx_market_symbol_time ON market_snapshots(workspace_id, symbol, source_timestamp DESC);
CREATE INDEX idx_orders_workspace_status ON paper_orders(workspace_id, status, submitted_at);
CREATE INDEX idx_audit_workspace_time ON audit_events(workspace_id, occurred_at, id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

CREATE TRIGGER ledger_entries_no_update BEFORE UPDATE ON ledger_entries
BEGIN SELECT RAISE(ABORT, 'ledger_entries are append-only'); END;
CREATE TRIGGER ledger_entries_no_delete BEFORE DELETE ON ledger_entries
BEGIN SELECT RAISE(ABORT, 'ledger_entries are append-only'); END;
CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit_events are append-only'); END;
CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit_events are append-only'); END;
