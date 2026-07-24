CREATE TABLE runtime_ai_results (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  actor_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider='openrouter'),
  model TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_runtime_ai_identity_time ON runtime_ai_results(workspace_id,actor_id,created_at DESC);
