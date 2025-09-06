// Simple in-memory rate limiting and failure tracking.
// Note: This is per-process only. For multi-instance/serverless, use a shared store.

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();

// Optional: Upstash Redis REST API for production shared rate limits
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRemote = !!(UPSTASH_URL && UPSTASH_TOKEN);

function now() {
  return Date.now();
}

function makeKey(prefix: string, parts: (string | number | undefined | null)[]) {
  return `${prefix}:${parts.filter(Boolean).join(':')}`;
}

function getBucket(key: string): Bucket {
  const b = buckets.get(key);
  if (b) return b;
  const nb = { count: 0, windowStart: now() };
  buckets.set(key, nb);
  return nb;
}

async function remoteIncr(key: string, windowMs: number): Promise<number> {
  if (!hasRemote) return -1;
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([["INCR", key], ["PEXPIRE", key, windowMs, "NX"]]),
    });
    const data = await res.json();
    // Upstash pipeline returns an array of results; first is INCR integer
    const count = Array.isArray(data) ? Number(data[0].result ?? data[0]) : Number.NaN;
    return Number.isFinite(count) ? count : -1;
  } catch {
    return -1;
  }
}

export async function hit(key: string, limit: number, windowMs: number) {
  if (hasRemote) {
    const count = await remoteIncr(key, windowMs);
    if (count >= 0) return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    // fall through to in-memory if remote failed
  }
  const b = getBucket(key);
  const t = now();
  if (t - b.windowStart > windowMs) {
    b.windowStart = t;
    b.count = 0;
  }
  b.count += 1;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count) };
}

// Login-specific helpers
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_EMAIL_LIMIT = 10; // max attempts per email per window
const LOGIN_IP_LIMIT = 100; // max attempts per IP per window
const FAIL_LOCK_THRESHOLD = 5; // after 5 failures, suggest lockout

export async function hitLoginIp(ip: string) {
  const key = makeKey('login-ip', [ip || 'unknown']);
  return hit(key, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
}

export async function recordLoginFailure(email: string, ip?: string) {
  if (ip) await hitLoginIp(ip);
  const key = makeKey('login-email', [email.toLowerCase()]);
  const res = await hit(key, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS);
  // When remote is used, we don't have bucket state; derive count from remaining
  let count: number;
  if (hasRemote) {
    count = LOGIN_EMAIL_LIMIT - res.remaining;
  } else {
    const b = getBucket(key);
    count = b.count;
  }
  return { count, windowMs: LOGIN_WINDOW_MS, overLimit: !res.allowed, reachedLockThreshold: count >= FAIL_LOCK_THRESHOLD };
}

export async function clearLoginFailures(email: string) {
  const key = makeKey('login-email', [email.toLowerCase()]);
  if (hasRemote) {
    try {
      await fetch(`${UPSTASH_URL}/DEL/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } });
    } catch {}
  }
  buckets.delete(key);
}

// Generic endpoint rate limiters
export async function hitEndpoint(name: string, id: string, limit: number, windowMs: number) {
  const key = makeKey(`ep-${name}`, [id]);
  return hit(key, limit, windowMs);
}
