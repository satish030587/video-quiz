"use client";
import { useEffect, useState } from "react";
import QuestionForm, { QuestionType } from "./QuestionForm";
import CsvImportGuide from "./CsvImportGuide";

type Module = { id: string; order: number; title: string };
type Question = { 
  id: string; 
  text: string; 
  options: string[]; 
  correctIndex: number; 
  active: boolean;
  questionType?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
};

export default function AdminQuestions() {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eText, setEText] = useState("");
  const [eOptions, setEOptions] = useState("");
  const [eCorrectIndex, setECorrectIndex] = useState(0);
  const [eQuestionType, setEQuestionType] = useState<QuestionType>("MCQ_4");
  const [uploading, setUploading] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  async function loadModules() {
    const res = await fetch("/api/admin/modules", { cache: "no-store" });
    const data = await res.json();
    setModules(data.modules);
    if (!moduleId && data.modules.length) setModuleId(data.modules[0].id);
  }
  useEffect(() => { loadModules(); }, []);

  async function loadQuestions() {
    if (!moduleId) return;
    const res = await fetch(`/api/admin/questions?moduleId=${encodeURIComponent(moduleId)}`, { cache: "no-store" });
    const data = await res.json();
    setQuestions(data.questions);
  }
  useEffect(() => { loadQuestions(); }, [moduleId]);

  async function addQuestion(data: {
    text: string;
    options: string[];
    correctIndex: number;
    questionType: QuestionType;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer: string;
  }) {
    setMessage(null);
    const res = await fetch(`/api/admin/questions`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        moduleId, 
        ...data
      }) 
    });
    
    const responseData = await res.json().catch(() => ({}));
    
    if (!res.ok) { 
      setMessage(responseData.message || "Failed to add"); 
      return; 
    }
    
    loadQuestions();
  }

  async function toggleActive(id: string, active: boolean) {
    setMessage(null);
    const res = await fetch(`/api/admin/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    if (!res.ok) { setMessage("Update failed"); return; }
    loadQuestions();
  }

  async function remove(id: string) {
    setMessage(null);
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("Delete failed"); return; }
    loadQuestions();
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setEText(q.text);
    setEOptions(q.options.join(" | "));
    setECorrectIndex(q.correctIndex);
    setEQuestionType((q.questionType as QuestionType) || "MCQ_4");
  }

  async function saveEdit(data: {
    text: string;
    options: string[];
    correctIndex: number;
    questionType: QuestionType;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer: string;
  }) {
    if (!editingId) return;
    
    const res = await fetch(`/api/admin/questions/${editingId}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(data) 
    });
    
    if (!res.ok) { 
      setMessage("Save failed"); 
      return; 
    }
    
    setEditingId(null);
    loadQuestions();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Questions</h1>
      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] my-4">
        <h3 className="font-semibold mb-2">Bulk Import (CSV)</h3>
        <CsvImportGuide />
        <form onSubmit={async (e) => {
          e.preventDefault(); setImportMsg(null); setUploading(true);
          const input = document.getElementById('csvfile') as HTMLInputElement | null;
          if (!input || !input.files || input.files.length === 0) { setImportMsg('Choose a CSV file'); setUploading(false); return; }
          const fd = new FormData(); fd.append('file', input.files[0]);
          const res = await fetch('/api/admin/questions/import', { method: 'POST', body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { setImportMsg(data.message || 'Import failed'); setUploading(false); return; }
          setImportMsg(`Imported ${data.imported}/${data.total}. Failed: ${data.failed}`);
          setUploading(false);
          loadQuestions();
        }} className="grid gap-2 max-w-[640px]">
          <input id="csvfile" type="file" accept=".csv,text/csv" />
          <div className="flex items-center gap-2">
            <button disabled={uploading} className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95 disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload & Import'}</button>
            {importMsg && <span className="text-sm text-slate-700">{importMsg}</span>}
          </div>
        </form>
      </section>
      <div className="mb-2">
        <label className="mr-2">Module:</label>
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.order}. {m.title}</option>
          ))}
        </select>
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] my-4">
        <h3 className="font-semibold mb-2">Add Question</h3>
        <QuestionForm onSubmit={addQuestion} />
      </section>

      <h3 className="font-semibold mb-2">Existing</h3>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Text</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Type</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Options</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Correct</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Active</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="px-2 py-2 border-b border-slate-100">
                  {q.text}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {q.questionType || "MCQ_4"}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {q.options.join(" | ")}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {q.correctAnswer || q.options[q.correctIndex]}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">{q.active ? "Yes" : "No"}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {editingId === q.id ? (
                    <div className="flex gap-2">
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => startEdit(q)}>Edit</button>
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => toggleActive(q.id, !q.active)}>{q.active ? "Deactivate" : "Activate"}</button>
                      <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(q.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Edit Question Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Question</h3>
            <QuestionForm 
              onSubmit={saveEdit}
              initialText={eText}
              initialOptions={eOptions.split("|").map(s => s.trim()).filter(Boolean)}
              initialCorrectIndex={eCorrectIndex}
              initialQuestionType={(questions.find(q => q.id === editingId)?.questionType as QuestionType) || "MCQ_4"}
              buttonText="Save Changes"
            />
            <button 
              className="mt-4 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
