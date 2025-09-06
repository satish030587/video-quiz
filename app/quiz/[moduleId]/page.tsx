"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { key: number; text: string };
type Question = { id: string; text: string; options: Option[] };

export default function QuizPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<{ passScore: number; timeLimitSeconds: number; title: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/quiz/${moduleId}`);
      if (!res.ok) {
        setError((await res.json().catch(() => ({ message: "Failed" }))).message || "Failed to load quiz");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setMeta({ passScore: data.quiz.passScore, timeLimitSeconds: data.quiz.timeLimitSeconds, title: data.module.title });
      setLoading(false);
    }
    load();
  }, [moduleId]);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (meta) setSecondsLeft(meta.timeLimitSeconds);
  }, [meta]);

  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0 && !submitted) {
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitted]);

  async function submit() {
    if (submitted) return;
    setSubmitted(true);
    const payload = { moduleId, answers: questions.map((q) => ({ questionId: q.id, optionKey: answers[q.id] })) };
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setSubmitted(false);
      setError((await res.json().then((d: any) => d.message).catch(() => "Submit failed")) || "Submit failed");
      return;
    }
    const data = await res.json();
    const params = new URLSearchParams({
      score: String(data.score),
      passed: data.passed ? "1" : "0",
      tq: String(data.totalQuestions ?? 0),
      ta: String(data.totalAnswered ?? 0),
      tc: String(data.totalCorrect ?? 0),
      tw: String(Math.max(0, (data.totalAnswered ?? 0) - (data.totalCorrect ?? 0))),
      req: String(data.passScore ?? 0),
      rem: String(data.attemptsRemaining ?? 0),
      an: String(data.attemptNo ?? 0),
    }).toString();
    router.replace(`/results/${moduleId}?${params}`);
  }

  // Derived UI helpers
  const total = questions.length;
  const answeredCount = questions.reduce((n, q) => (answers[q.id] != null ? n + 1 : n), 0);
  const timeText = (() => {
    const s = Math.max(0, secondsLeft ?? 0);
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sc = Math.floor(s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sc}`;
  })();

  function jumpTo(i: number) {
    setIndex(Math.min(Math.max(0, i), Math.max(0, total - 1)));
  }

  function selectOption(qId: string, optKey: number) {
    setAnswers((a) => ({ ...a, [qId]: optKey }));
  }

  function Ring({ value, total }: { value: number; total: number }) {
    const pct = total > 0 ? value / total : 0;
    const R = 36;
    const C = 2 * Math.PI * R;
    const dash = Math.max(0.001, pct) * C;
    const gap = C - dash;
    return (
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-[color:var(--color-brand)] transition-all"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-700">
          {value}/{total}
        </div>
      </div>
    );
  }

  if (loading) return <main>Loading quiz...</main>;
  if (error) return <main>Error: {error}</main>;
  if (!meta) return null;
  const current = questions[index];
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-3 text-[color:var(--color-brand)]">Quiz: {meta.title}</h1>

      {/* Card */}
      <section className="rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        {/* Header row */}
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-700">
            {/* Clock icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-500">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm">Time remaining</span>
            <b className="tabular-nums">{timeText}</b>
          </div>
          <div className="ml-auto">
            <button
              className="rounded bg-[color:var(--color-brand)] text-white px-4 py-1.5 text-sm hover:opacity-95 disabled:opacity-60"
              onClick={submit}
              disabled={submitted}
            >
              Submit
            </button>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 p-5">
          {/* Left: question + options */}
          <div>
            <div className="mb-1 text-sm text-slate-600">Question {index + 1} of {total}</div>
            <div className="mb-4 text-[15px] leading-6 font-semibold">{current.text}</div>
            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const checked = answers[current.id] === opt.key;
                const letter = String.fromCharCode(65 + i); // A, B, C, ... based on display order
                return (
                  <label
                    key={opt.key}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer select-none transition-colors ${
                      checked
                        ? "bg-[color:var(--color-brand)]/10 border-[color:var(--color-brand)]"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${current.id}`}
                      className="sr-only"
                      checked={checked}
                      onChange={() => selectOption(current.id, opt.key)}
                    />
                    <span
                      className={`grid place-items-center w-7 h-7 rounded-md border text-xs font-semibold ${
                        checked
                          ? "bg-[color:var(--color-brand)] text-white border-[color:var(--color-brand)]"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {letter}.
                    </span>
                    <span className={`text-sm ${checked ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                      {opt.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right: progress ring */}
          <div className="md:pt-6 flex md:block justify-center">
            <Ring value={answeredCount} total={total} />
          </div>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 p-4 flex flex-wrap items-center gap-2">
          <button
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={() => jumpTo(index - 1)}
            disabled={index === 0}
          >
            Prev
          </button>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isCurrent = i === index;
              const isDone = answers[q.id] != null;
              return (
                <button
                  key={q.id}
                  onClick={() => jumpTo(i)}
                  className={`w-8 h-8 rounded-md text-sm tabular-nums border transition-colors ${
                    isCurrent
                      ? "bg-[color:var(--color-brand)] text-white border-[color:var(--color-brand)]"
                      : isDone
                      ? "border-[color:var(--color-brand)]/60 text-[color:var(--color-brand)]/90 hover:bg-[color:var(--color-brand)]/5"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            className="ml-auto rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
            onClick={() => jumpTo(index + 1)}
            disabled={index >= total - 1}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
