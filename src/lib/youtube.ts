export function extractYouTubeId(input: string): string {
  if (!input) return input;
  const trim = input.trim();
  // If already looks like an ID (11 chars alnum/_-)
  if (/^[A-Za-z0-9_-]{11}$/.test(trim)) return trim;
  try {
    const url = new URL(trim);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean).pop() || "";
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      // /embed/<id>
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts[idx + 1] && /^[A-Za-z0-9_-]{11}$/.test(parts[idx + 1])) return parts[idx + 1];
    }
  } catch {}
  return trim; // fallback: return original string
}

