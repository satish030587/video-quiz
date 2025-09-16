"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { key: number; text: string };
type Question = { id: string; text: string; options: Option[] };

export default function QuizPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<{ passScore: number; title: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const storageKey = useMemo(() => `quiz:${moduleId}`, [moduleId]);

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
      setMeta({ passScore: data.quiz.passScore, title: data.module.title });
      setLoading(false);
    }
    load();
  }, [moduleId]);

  const [submitted, setSubmitted] = useState(false);
  
  // Restore saved answers and index (no timer)
  useEffect(() => {
    if (!meta) return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const saved = JSON.parse(raw) as { answers?: Record<string, number>; index?: number };
        if (saved.answers && typeof saved.answers === "object") setAnswers(saved.answers);
        if (typeof saved.index === "number") setIndex(Math.min(Math.max(0, saved.index), Math.max(0, (questions?.length ?? 1) - 1)));
      } else {
        if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify({ answers: {}, index: 0 }));
      }
    } catch {}
  }, [meta, storageKey, questions?.length]);

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
    // Clear persisted quiz state on successful submission
    try { if (typeof window !== "undefined") localStorage.removeItem(storageKey); } catch {}
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
  const allAnswered = total > 0 && answeredCount === total;

  function jumpTo(i: number) {
    const next = Math.min(Math.max(0, i), Math.max(0, total - 1));
    setIndex(next);
    // persist index
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        const saved = raw ? JSON.parse(raw) : {};
        saved.index = next;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
    } catch {}
  }

  function selectOption(qId: string, optKey: number) {
    setAnswers((a) => {
      const next = { ...a, [qId]: optKey };
      // persist answers
      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(storageKey);
          const saved = raw ? JSON.parse(raw) : {};
          saved.answers = next;
          localStorage.setItem(storageKey, JSON.stringify(saved));
        }
      } catch {}
      return next;
    });
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
        {/* Header row (no timer) */}
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <div className="text-slate-700 text-sm">Answer all questions to enable submit.</div>
          <div className="ml-auto">
            <button
              className="rounded bg-[color:var(--color-brand)] text-white px-4 py-1.5 text-sm hover:opacity-95 disabled:opacity-60"
              onClick={submit}
              disabled={submitted || !allAnswered}
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
        <div className="border-t border-slate-100 p-4">
          <div className="flex justify-center items-center">
            <div className="inline-flex items-center shadow-sm rounded-md overflow-hidden">
              <button
                className="bg-white px-3 py-1.5 text-sm border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50"
                onClick={() => jumpTo(index - 1)}
                disabled={index === 0}
              >
                Prev
              </button>
              
              <div className="flex border-t border-b border-slate-300">
                {questions.map((q, i) => {
                  const isCurrent = i === index;
                  const isDone = answers[q.id] != null;
                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpTo(i)}
                      className={`w-8 h-8 text-sm tabular-nums border-r last:border-r-0 transition-colors ${
                        isCurrent
                          ? "bg-[color:var(--color-brand)] text-white border-[color:var(--color-brand)]"
                          : isDone
                          ? "border-slate-300 text-[color:var(--color-brand)] hover:bg-[color:var(--color-brand)]/5"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="bg-white px-3 py-1.5 text-sm border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50"
                onClick={() => jumpTo(index + 1)}
                disabled={index >= total - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
