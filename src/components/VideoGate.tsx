"use client";
import { useState } from "react";
import { YouTubePlayer } from "./YouTubePlayer";
import Link from "next/link";

export default function VideoGate({ videoId, moduleId }: { videoId: string; moduleId: string }) {
  const [watched, setWatched] = useState(false);
  return (
    <div>
      <YouTubePlayer videoId={videoId} onEnded={() => setWatched(true)} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={`/quiz/${moduleId}`}>
          <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95 disabled:opacity-50" disabled={!watched}>Start Quiz</button>
        </Link>
        {!watched && <small className="text-slate-600">Watch the full video to unlock Start Quiz.</small>}
      </div>
      <div className="mt-2">
        <button onClick={()=>setWatched(true)} className="text-xs underline text-slate-600">Dev: mark watched</button>
      </div>
    </div>
  );
}
