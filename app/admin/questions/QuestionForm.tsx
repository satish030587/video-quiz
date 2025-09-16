"use client";
import { useState } from "react";

export type QuestionType = "MCQ_4" | "MCQ_2" | "TRUE_FALSE";

interface QuestionFormProps {
  onSubmit: (data: {
    text: string;
    options: string[];
    correctIndex: number;
    questionType: QuestionType;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer: string;
  }) => Promise<void>;
  initialText?: string;
  initialOptions?: string[];
  initialCorrectIndex?: number;
  initialQuestionType?: QuestionType;
  buttonText?: string;
}

export default function QuestionForm({
  onSubmit,
  initialText = "",
  initialOptions = ["", "", "", ""],
  initialCorrectIndex = 0,
  initialQuestionType = "MCQ_4",
  buttonText = "Add Question"
}: QuestionFormProps) {
  const [text, setText] = useState(initialText);
  const [questionType, setQuestionType] = useState<QuestionType>(initialQuestionType);
  const [correctAnswer, setCorrectAnswer] = useState<string>(
    initialQuestionType === "MCQ_4" ? "A" :
    initialQuestionType === "MCQ_2" ? "A" : "TRUE"
  );

  // For MCQ_4
  const [optionA, setOptionA] = useState(initialOptions[0] || "");
  const [optionB, setOptionB] = useState(initialOptions[1] || "");
  const [optionC, setOptionC] = useState(initialOptions[2] || "");
  const [optionD, setOptionD] = useState(initialOptions[3] || "");

  // For MCQ_2
  const [option1, setOption1] = useState(initialOptions[0] || "");
  const [option2, setOption2] = useState(initialOptions[1] || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let options: string[] = [];
    let correctIndex = 0;
    
    switch (questionType) {
      case "MCQ_4":
        options = [optionA, optionB, optionC, optionD];
        correctIndex = correctAnswer === "A" ? 0 : 
                      correctAnswer === "B" ? 1 : 
                      correctAnswer === "C" ? 2 : 3;
        break;
      case "MCQ_2":
        options = [option1, option2];
        correctIndex = correctAnswer === "A" ? 0 : 1;
        break;
      case "TRUE_FALSE":
        options = ["TRUE", "FALSE"];
        correctIndex = correctAnswer === "TRUE" ? 0 : 1;
        break;
    }

    await onSubmit({
      text,
      options,
      correctIndex,
      questionType,
      optionA: questionType === "MCQ_4" ? optionA : undefined,
      optionB: questionType === "MCQ_4" ? optionB : 
               questionType === "MCQ_2" ? option2 : undefined,
      optionC: questionType === "MCQ_4" ? optionC : undefined,
      optionD: questionType === "MCQ_4" ? optionD : undefined,
      correctAnswer
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 max-w-[640px]">
      <div>
        <label className="block mb-1 text-sm font-medium">Question Type</label>
        <select
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as QuestionType)}
        >
          <option value="MCQ_4">Multiple Choice (4 options)</option>
          <option value="MCQ_2">Multiple Choice (2 options)</option>
          <option value="TRUE_FALSE">True/False</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Question Text</label>
        <textarea
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
          placeholder="Question text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={3}
        />
      </div>

      {questionType === "MCQ_4" && (
        <>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionA"
                checked={correctAnswer === "A"}
                onChange={() => setCorrectAnswer("A")}
              />
              <label htmlFor="optionA" className="block text-sm font-medium w-8">A</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option A"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionB"
                checked={correctAnswer === "B"}
                onChange={() => setCorrectAnswer("B")}
              />
              <label htmlFor="optionB" className="block text-sm font-medium w-8">B</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option B"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionC"
                checked={correctAnswer === "C"}
                onChange={() => setCorrectAnswer("C")}
              />
              <label htmlFor="optionC" className="block text-sm font-medium w-8">C</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option C"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionD"
                checked={correctAnswer === "D"}
                onChange={() => setCorrectAnswer("D")}
              />
              <label htmlFor="optionD" className="block text-sm font-medium w-8">D</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option D"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

      {questionType === "MCQ_2" && (
        <>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="option1"
                checked={correctAnswer === "A"}
                onChange={() => setCorrectAnswer("A")}
              />
              <label htmlFor="option1" className="block text-sm font-medium w-8">A</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option A"
                value={option1}
                onChange={(e) => setOption1(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="option2"
                checked={correctAnswer === "B"}
                onChange={() => setCorrectAnswer("B")}
              />
              <label htmlFor="option2" className="block text-sm font-medium w-8">B</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
                placeholder="Option B"
                value={option2}
                onChange={(e) => setOption2(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      )}

      {questionType === "TRUE_FALSE" && (
        <>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionTrue"
                checked={correctAnswer === "TRUE"}
                onChange={() => setCorrectAnswer("TRUE")}
              />
              <label htmlFor="optionTrue" className="block text-sm">True</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                id="optionFalse"
                checked={correctAnswer === "FALSE"}
                onChange={() => setCorrectAnswer("FALSE")}
              />
              <label htmlFor="optionFalse" className="block text-sm">False</label>
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95"
      >
        {buttonText}
      </button>
    </form>
  );
}