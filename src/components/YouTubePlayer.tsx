"use client";
import { useEffect, useRef } from "react";
import { extractYouTubeId } from "@/lib/youtube";

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void }
}

function isValidYouTubeId(id: string | undefined | null) {
  if (!id) return false;
  // Typical YouTube video IDs are 11 chars [A-Za-z0-9_-]
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

export function YouTubePlayer({ videoId, onEnded }: { videoId: string; onEnded?: () => void }) {
  const normalizedId = isValidYouTubeId(videoId) ? videoId : extractYouTubeId(videoId);
  const valid = isValidYouTubeId(normalizedId);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>(`ytp_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!valid) return;
    let player: any;
    const mount = () => {
      if (!containerRef.current) return;
      if (!window.YT || !window.YT.Player) return;
      // Avoid duplicate initialization in React strict/dev
      if (containerRef.current.querySelector('iframe')) return;
      // Ensure target element exists and has dimensions
      player = new window.YT.Player(idRef.current, {
        videoId: normalizedId,
        events: {
          onStateChange: (e: any) => {
            // 0 = ended
            if (e.data === 0 && onEnded) onEnded();
          },
        },
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
      });
    };

    // Load API if needed (robust against race conditions)
    const ensureApi = () => {
      if (window.YT && window.YT.Player) {
        mount();
        return;
      }
      // Set the ready callback before injecting script
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        mount();
      };
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true as any;
        tag.onload = () => {
          // Some environments don't call onYouTubeIframeAPIReady reliably
          if (window.YT && window.YT.Player) mount();
        };
        (document.head || document.body).appendChild(tag);
      }
    };

    ensureApi();

    return () => {
      try { player?.destroy?.(); } catch {}
    };
  }, [normalizedId, onEnded, valid]);

  if (!valid) {
    return (
      <div style={{ aspectRatio: "16/9", width: "100%", display: "grid", placeItems: "center", border: "1px solid #eee" }}>
        <div style={{ opacity: 0.7 }}>Video unavailable (invalid or missing YouTube ID)</div>
      </div>
    );
  }

  return (
    <div style={{ aspectRatio: "16/9", width: "100%" }}>
      <div id={idRef.current} ref={containerRef as any} style={{ width: "100%", height: "100%", minHeight: 200 }} />
    </div>
  );
}
