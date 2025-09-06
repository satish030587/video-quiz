import fs from "fs";
import path from "path";

type ProfileMeta = { address?: string; phone?: string };
type ProfileMap = Record<string, ProfileMeta>;

function filePath() {
  const dir = path.join(process.cwd(), "backend", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "profile.json");
}

export function readProfileMap(): ProfileMap {
  try {
    const fp = filePath();
    if (!fs.existsSync(fp)) return {};
    const raw = fs.readFileSync(fp, "utf8");
    return JSON.parse(raw) as ProfileMap;
  } catch {
    return {};
  }
}

export function writeProfileMap(map: ProfileMap) {
  const fp = filePath();
  fs.writeFileSync(fp, JSON.stringify(map, null, 2), "utf8");
}

export function getProfileMeta(userId: string): ProfileMeta {
  const map = readProfileMap();
  return map[userId] || {};
}

export function setProfileMeta(userId: string, meta: ProfileMeta) {
  const map = readProfileMap();
  map[userId] = { ...(map[userId] || {}), ...meta };
  writeProfileMap(map);
}

