// Admin sign-in for /admin. Credentials come from storage (set via "Change password"), falling back to
// the ADMIN_USERNAME / ADMIN_PASSWORD env vars until a password has been changed once. Sessions are an
// HMAC-signed, httpOnly cookie keyed to the current credentials, so changing the password signs
// every other session out.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { readDoc, writeDoc } from "./storage";

const COOKIE = "pq_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const MIN_PASSWORD = 10;

type StoredCreds = { username: string; salt: string; hash: string; version: number; updatedAt: string };
type Creds = { username: string; check: (password: string) => boolean; sessionKey: Buffer; version: number };

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const scrypt = (password: string, salt: string) => scryptSync(password, salt, 64).toString("hex");
const sameHex = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));

function isStoredCreds(v: unknown): v is StoredCreds {
  const c = v as StoredCreds;
  return !!c && typeof c.username === "string" && typeof c.salt === "string" && typeof c.hash === "string";
}

// Small per-instance cache so every admin request doesn't re-download the credentials. Checks that fail
// retry once with `fresh`, so a password changed on another server instance takes effect immediately.
let cached: { at: number; value: StoredCreds | null } | null = null;
async function storedCreds(fresh = false): Promise<StoredCreds | null> {
  if (!fresh && cached && Date.now() - cached.at < 30_000) return cached.value;
  const raw = await readDoc("admin"); // throws if storage is unreachable — never silently fall back to env
  cached = { at: Date.now(), value: isStoredCreds(raw) ? raw : null };
  return cached.value;
}

async function activeCreds(fresh = false): Promise<Creds | null> {
  const s = await storedCreds(fresh);
  if (s) {
    return {
      username: s.username,
      check: (pw) => sameHex(scrypt(pw, s.salt), s.hash),
      sessionKey: sha256(`pq-session:${s.username}:${s.hash}:${s.version}`),
      version: s.version,
    };
  }
  const u = process.env.ADMIN_USERNAME?.trim();
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return null;
  return {
    username: u,
    check: (pw) => timingSafeEqual(sha256(pw), sha256(p)),
    sessionKey: sha256(`pq-session-env:${u}:${p}`),
    version: 0,
  };
}

const sameUser = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** "ready" once credentials exist (stored or env); "unconfigured" before the env vars are set. */
export async function adminSetup(): Promise<"ready" | "unconfigured" | "error"> {
  await connection(); // per-request: reads the clock and storage
  try {
    return (await activeCreds()) ? "ready" : "unconfigured";
  } catch {
    return "error";
  }
}

async function writeSession(key: Buffer) {
  const exp = Date.now() + MAX_AGE * 1000;
  const sig = createHmac("sha256", key).update(String(exp)).digest("hex");
  (await cookies()).set(COOKIE, `${exp}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function isAdmin(): Promise<boolean> {
  await connection(); // per-request: session expiry depends on the current time
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const valid = (creds: Creds | null) =>
    !!creds && sameHex(sig, createHmac("sha256", creds.sessionKey).update(exp).digest("hex"));
  try {
    return valid(await activeCreds()) || (cached !== null && valid(await activeCreds(true)));
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Your session has ended — please sign in again.");
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

// Brute-force guard: after 8 failed attempts from one IP, sign-in pauses for 15 minutes (per server instance).
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
}
function recentFailures(ip: string) {
  const now = Date.now();
  const recent = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(ip, recent);
  return recent;
}

export async function signIn(username: string, password: string): Promise<string | null> {
  const ip = await clientIp();
  if (recentFailures(ip).length >= 8) return "Too many attempts. Please wait 15 minutes and try again.";
  let creds: Creds | null;
  try {
    creds = await activeCreds();
  } catch {
    return "Can't reach storage right now. Please try again in a moment.";
  }
  if (!creds) return "Admin login isn't set up yet (ADMIN_USERNAME / ADMIN_PASSWORD).";
  const matches = (c: Creds | null) => !!c && sameUser(username, c.username) && c.check(password);
  if (!matches(creds)) {
    const latest = await activeCreds(true).catch(() => null); // maybe changed on another instance
    if (!matches(latest)) {
      recentFailures(ip).push(Date.now());
      return "Wrong username or password.";
    }
    creds = latest!;
  }
  failures.delete(ip);
  await writeSession(creds.sessionKey);
  return null;
}

export async function changeCredentials(current: string, username: string, next: string): Promise<string | null> {
  await requireAdmin();
  const creds = await activeCreds();
  if (!creds || !creds.check(current)) return "Current password is incorrect.";
  if (!username.trim()) return "Username can't be empty.";
  if (next.length < MIN_PASSWORD) return `New password must be at least ${MIN_PASSWORD} characters.`;
  const salt = randomBytes(16).toString("hex");
  const stored: StoredCreds = {
    username: username.trim(),
    salt,
    hash: scrypt(next, salt),
    version: creds.version + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeDoc("admin", stored);
  cached = { at: Date.now(), value: stored };
  // This browser stays signed in under the new credentials; every other session is now invalid.
  await writeSession(sha256(`pq-session:${stored.username}:${stored.hash}:${stored.version}`));
  return null;
}

export async function currentUsername(): Promise<string> {
  await connection();
  try {
    return (await activeCreds())?.username ?? "";
  } catch {
    return "";
  }
}
