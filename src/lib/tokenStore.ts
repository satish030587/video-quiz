import fs from "fs";
import path from "path";
import crypto from "crypto";

type Purpose = "reset" | "verify-email" | "mfa-setup" | "invite";

type TokenRecord = {
  id: string;
  userId: string;
  purpose: Purpose;
  tokenHash: string;
  expiresAt: number; // epoch ms
  createdAt: number; // epoch ms
};

type FileShape = { tokens: TokenRecord[] };

function filePath() {
  const dir = path.join(process.cwd(), "backend", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "authTokens.json");
}

function readFile(): FileShape {
  try {
    const fp = filePath();
    if (!fs.existsSync(fp)) return { tokens: [] };
    return JSON.parse(fs.readFileSync(fp, "utf8")) as FileShape;
  } catch {
    return { tokens: [] };
  }
}

function writeFile(data: FileShape) {
  const fp = filePath();
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
}

function sha256(x: string) {
  return crypto.createHash("sha256").update(x).digest("hex");
}

function cuid() {
  // lightweight cuid-ish
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createToken(userId: string, purpose: Purpose, ttlMinutes: number) {
  const plain = crypto.randomBytes(24).toString("hex");
  const rec: TokenRecord = {
    id: cuid(),
    userId,
    purpose,
    tokenHash: sha256(plain),
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };
  const data = readFile();
  data.tokens = data.tokens.filter((t) => !(t.userId === userId && t.purpose === purpose)); // revoke previous for same purpose
  data.tokens.push(rec);
  writeFile(data);
  return plain;
}

export function verifyAndConsume(purpose: Purpose, token: string): { ok: boolean; userId?: string } {
  const th = sha256(token);
  const data = readFile();
  const idx = data.tokens.findIndex((t) => t.purpose === purpose && t.tokenHash === th);
  if (idx === -1) return { ok: false };
  const rec = data.tokens[idx];
  const expired = Date.now() > rec.expiresAt;
  // consume
  data.tokens.splice(idx, 1);
  writeFile(data);
  if (expired) return { ok: false };
  return { ok: true, userId: rec.userId };
}

export function revokeUserTokens(userId: string, purpose: Purpose) {
  const data = readFile();
  data.tokens = data.tokens.filter((t) => !(t.userId === userId && t.purpose === purpose));
  writeFile(data);
}

