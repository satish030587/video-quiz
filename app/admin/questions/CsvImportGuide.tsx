"use client";
import { useState } from "react";

export default function CsvImportGuide() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sample CSV content
  const sampleCsv = `question_type,question_text,option_a,option_b,option_c,option_d,correct_answer,sub_module_id
MCQ_4,What is the capital of France?,Paris,London,Berlin,Madrid,A,mod_123
MCQ_4,Which planet is closest to the Sun?,Earth,Venus,Mercury,Mars,C,mod_123
MCQ_2,Is water wet?,Yes,No,,,A,mod_123
MCQ_2,Should you format your hard drive without backing up?,Yes,No,,,B,mod_123
TRUE_FALSE,The Earth is flat.,,,,,FALSE,mod_123
TRUE_FALSE,HTML is a programming language.,,,,,FALSE,mod_123`;

  // Function to download sample CSV
  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'question_import_sample.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm text-slate-600 hover:text-slate-800"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="ml-1">CSV Import Guide</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 p-4 border border-slate-200 rounded-md bg-slate-50">
          <h4 className="text-lg font-medium mb-2">CSV Format Guide</h4>
          
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium">Required Headers:</p>
            <code className="block p-2 bg-slate-100 text-xs rounded mb-2 overflow-x-auto">
              question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, sub_module_id
            </code>
          </div>
          
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium">Supported Question Types:</p>
            <ul className="list-disc list-inside text-sm">
              <li><code>MCQ_4</code>: Multiple choice with 4 options (A-D)</li>
              <li><code>MCQ_2</code>: Multiple choice with 2 options (A-B)</li>
              <li><code>TRUE_FALSE</code>: True/False questions</li>
            </ul>
          </div>
          
          <div className="mb-3">
            <p className="mb-1 text-sm font-medium">Correct Answer Format:</p>
            <ul className="list-disc list-inside text-sm">
              <li>For MCQ_4: <code>A</code>, <code>B</code>, <code>C</code>, or <code>D</code></li>
              <li>For MCQ_2: <code>A</code> or <code>B</code></li>
              <li>For TRUE_FALSE: <code>TRUE</code> or <code>FALSE</code></li>
            </ul>
          </div>
          
          <button
            onClick={downloadSampleCsv}
            className="mt-2 px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 rounded"
          >
            Download Sample CSV
          </button>
        </div>
      )}
    </div>
  );
}