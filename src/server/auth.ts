import type { Request, Response } from "express";
import type Database from "better-sqlite3";
import { appendAudit } from "./audit.js";
import type { RuntimeConfig } from "./config.js";
import { hashPassword, hmac, newId, randomToken, safeEqual, sha256, verifyPassword } from "./crypto.js";
import { DEFAULT_WORKSPACE_ID } from "./database.js";
import { DomainError } from "./ledger.js";

export interface Actor {
  id: string;
  role: "operator" | "auditor";
  viaServiceToken: boolean;
  csrfToken?: string;
}

function cookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie || "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function serviceActor(request: Request, config: RuntimeConfig): Actor | null {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const claimed = String(request.headers["x-actor-id"] || "service").trim();
  if (!/^[a-zA-Z0-9@._:-]{2,120}$/.test(claimed)) throw new DomainError("invalid_actor", "x-actor-id is invalid.", 400);
  if (safeEqual(token, config.operatorToken)) return { id: `operator:${claimed}`, role: "operator", viaServiceToken: true };
  if (safeEqual(token, config.auditorToken)) return { id: `auditor:${claimed}`, role: "auditor", viaServiceToken: true };
  return null;
}

export function authenticate(request: Request, db: Database.Database, config: RuntimeConfig): Actor {
  const service = serviceActor(request, config);
  if (service) return service;
  const sessionToken = cookie(request, "cashflow_session");
  if (!sessionToken) throw new DomainError("authentication_required", "Authentication required.", 401);
  const now = new Date().toISOString();
  const row = db.prepare(`SELECT s.csrf_token,s.expires_at,u.id,u.role,u.active FROM sessions s
    JOIN users u ON u.id=s.user_id WHERE s.id_hash=?`).get(sha256(sessionToken)) as Record<string, unknown> | undefined;
  if (!row || !row.active || String(row.expires_at) <= now) throw new DomainError("authentication_required", "Authentication required.", 401);
  return { id: `user:${row.id}`, role: row.role as Actor["role"], viaServiceToken: false, csrfToken: String(row.csrf_token) };
}

export function authorize(request: Request, db: Database.Database, config: RuntimeConfig, role: "operator" | "auditor", mutating = false): Actor {
  const actor = authenticate(request, db, config);
  if (role === "operator" && actor.role !== "operator") throw new DomainError("operator_required", "Operator role required.", 403);
  if (mutating && !actor.viaServiceToken && !safeEqual(String(request.headers["x-csrf-token"] || ""), actor.csrfToken || "")) {
    throw new DomainError("csrf_rejected", "CSRF token is missing or invalid.", 403);
  }
  return actor;
}

function email(value: unknown): string {
  const normalized = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) throw new DomainError("invalid_credentials", "Invalid email or password.", 401);
  return normalized;
}

export function login(db: Database.Database, config: RuntimeConfig, request: Request, response: Response, body: Record<string, unknown>): Record<string, unknown> {
  const normalizedEmail = email(body.email);
  const password = String(body.password || "");
  const identity = hmac(`${normalizedEmail}:${request.ip}`, config.identityHashSecret);
  const now = new Date();
  const attempt = db.prepare("SELECT * FROM auth_attempts WHERE identity_hash=?").get(identity) as Record<string, unknown> | undefined;
  if (attempt?.locked_until && Date.parse(String(attempt.locked_until)) > now.getTime()) throw new DomainError("login_locked", "Too many failed attempts. Try later.", 429);
  const user = db.prepare("SELECT * FROM users WHERE email=? COLLATE NOCASE AND active=1").get(normalizedEmail) as Record<string, unknown> | undefined;
  if (!user || !verifyPassword(password, String(user.password_hash))) {
    const windowStart = attempt && now.getTime() - Date.parse(String(attempt.window_started_at)) < 15 * 60_000 ? String(attempt.window_started_at) : now.toISOString();
    const failures = attempt && windowStart === attempt.window_started_at ? Number(attempt.failures) + 1 : 1;
    const lockedUntil = failures >= 5 ? new Date(now.getTime() + 15 * 60_000).toISOString() : null;
    db.prepare(`INSERT INTO auth_attempts(identity_hash,failures,window_started_at,locked_until) VALUES(?,?,?,?)
      ON CONFLICT(identity_hash) DO UPDATE SET failures=excluded.failures,window_started_at=excluded.window_started_at,locked_until=excluded.locked_until`)
      .run(identity, failures, windowStart, lockedUntil);
    throw new DomainError("invalid_credentials", "Invalid email or password.", 401);
  }
  db.prepare("DELETE FROM auth_attempts WHERE identity_hash=?").run(identity);
  db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(now.toISOString());
  const token = randomToken();
  const csrfToken = randomToken(24);
  const expires = new Date(now.getTime() + 8 * 60 * 60_000);
  db.prepare("INSERT INTO sessions(id_hash,user_id,csrf_token,expires_at,created_at) VALUES(?,?,?,?,?)")
    .run(sha256(token), String(user.id), csrfToken, expires.toISOString(), now.toISOString());
  response.cookie("cashflow_session", token, { httpOnly: true, secure: config.production, sameSite: "strict", path: "/", expires });
  appendAudit(db, `user:${user.id}`, "auth.login", "user", String(user.id), { role: user.role });
  return { authenticated: true, role: user.role, csrfToken, expiresAt: expires.toISOString() };
}

export function logout(db: Database.Database, config: RuntimeConfig, request: Request, response: Response): void {
  const token = cookie(request, "cashflow_session");
  if (token) db.prepare("DELETE FROM sessions WHERE id_hash=?").run(sha256(token));
  response.clearCookie("cashflow_session", { httpOnly: true, secure: config.production, sameSite: "strict", path: "/" });
}

export function bootstrapUser(db: Database.Database, input: { email: string; password: string; role: "operator" | "auditor" }): string {
  const normalizedEmail = email(input.email);
  const existing = db.prepare("SELECT id FROM users WHERE email=? COLLATE NOCASE").get(normalizedEmail);
  if (existing) throw new Error("User already exists; bootstrap never overwrites or promotes accounts.");
  const id = newId("user");
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users(id,workspace_id,email,password_hash,role,active,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)")
    .run(id, DEFAULT_WORKSPACE_ID, normalizedEmail, hashPassword(input.password), input.role, now, now);
  appendAudit(db, "bootstrap", "user.created", "user", id, { role: input.role, emailHash: sha256(normalizedEmail) });
  return id;
}
