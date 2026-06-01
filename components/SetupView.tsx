"use client";

import { useInterview } from "@/context/InterviewContext";
import { useState } from "react";

type SetupViewProps = {
  jobDescription: string;
  onJobDescriptionChange: (val: string) => void;
  resumeText: string;
  onResumeTextChange: (val: string) => void;
  resumeFileName: string;
  onResumeFileNameChange: (val: string) => void;
  parsingResume: boolean;
  onParsingResumeChange: (val: boolean) => void;
  onStart: () => void;
  generating: boolean;
};

export function SetupView({
  jobDescription,
  onJobDescriptionChange,
  resumeText,
  onResumeTextChange,
  resumeFileName,
  onResumeFileNameChange,
  parsingResume,
  onParsingResumeChange,
  onStart,
  generating
}: SetupViewProps) {
  const { state, dispatch } = useInterview();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Local state reflecting user selections, updated inside Profile Context
  const [role, setRole] = useState(state.profile.targetRole);
  const [exp, setExp] = useState(state.profile.experienceLevel);
  const [type, setType] = useState(state.profile.preferredType);
  const [duration, setDuration] = useState("30 Min");

  const canStart = jobDescription.trim().length > 80 && !generating;

  function handleSaveStep1() {
    dispatch({
      type: "UPDATE_PROFILE",
      payload: { targetRole: role, experienceLevel: exp, preferredType: type }
    });
    setCurrentStep(2);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header title */}
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400">Assessment Setup</span>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Configure Interview Room</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Choose target parameters to calibrate the AI mock session tailored precisely to your background.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center items-center gap-6 max-w-xs mx-auto">
        <div
          className={`flex-1 text-center pb-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition ${
            currentStep === 1 ? "border-violet-500 text-violet-400" : "border-white/5 text-slate-500"
          }`}
        >
          1. Scope Details
        </div>
        <div
          className={`flex-1 text-center pb-2 border-b-2 text-xs font-semibold uppercase tracking-wider transition ${
            currentStep === 2 ? "border-violet-500 text-violet-400" : "border-white/5 text-slate-500"
          }`}
        >
          2. Uploads & Paste
        </div>
      </div>

      {/* Step Card Content */}
      <div className="rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Step 1: Scope */}
        {currentStep === 1 && (
          <div className="space-y-6">
            
            {/* Target Role Selector */}
            <div className="space-y-2">
              <label htmlFor="targetRole" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Target Role
              </label>
              <input
                id="targetRole"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-100 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 font-mono"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            {/* Grid for Experience level and Interview type */}
            <div className="grid gap-4 sm:grid-cols-2">
              
              {/* Difficulty Selection */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Experience Level</span>
                <select
                  value={exp}
                  onChange={(e) => setExp(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/50"
                >
                  <option value="Associate / Junior">Associate / Junior</option>
                  <option value="Mid-Senior">Mid-Senior</option>
                  <option value="Principal / Lead">Principal / Lead</option>
                </select>
              </div>

              {/* Interview Type Selection */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Interview Focus Round</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/50"
                >
                  <option value="HR / Behavioral">HR / Behavioral</option>
                  <option value="Technical">Technical</option>
                  <option value="DSA">DSA</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>

            </div>

            {/* Target Duration Selection */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Assessment Target Duration</span>
              <div className="grid grid-cols-3 gap-3">
                {["15 Min", "30 Min", "45 Min"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                      duration === d
                        ? "bg-violet-500/10 border border-violet-500/30 text-violet-400 font-extrabold"
                        : "border border-white/5 bg-[#090d12]/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Continue */}
            <button
              type="button"
              onClick={handleSaveStep1}
              className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white py-3 text-xs font-bold uppercase tracking-widest transition"
            >
              Configure Uploads
            </button>
          </div>
        )}

        {/* Step 2: Uploads & Paste */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Resume upload area */}
            <div className="space-y-2">
              <label htmlFor="resumeUploadSetup" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Resume PDF Upload (Optional)
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#090d12]/40">
                <input
                  id="resumeUploadSetup"
                  type="file"
                  accept="application/pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    onParsingResumeChange(true);
                    onResumeFileNameChange(file.name);
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const pdfjs: any = await import("pdfjs-dist/build/pdf");
                      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
                      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                      let extracted = "";
                      for (let i = 1; i <= pdf.numPages; i++) {
                        // eslint-disable-next-line no-await-in-loop
                        const page = await pdf.getPage(i);
                        // eslint-disable-next-line no-await-in-loop
                        const content = await page.getTextContent();
                        const pageText = content.items.map((item: any) => (item.str ? item.str : "")).join(" ");
                        extracted += pageText + "\n\n";
                      }
                      onResumeTextChange(extracted);
                    } catch (err) {
                      console.error("Resume parse failed", err);
                      onResumeTextChange("");
                      onResumeFileNameChange("");
                    } finally {
                      onParsingResumeChange(false);
                    }
                  }}
                  className="text-xs text-slate-300 cursor-pointer"
                />
                {parsingResume && <div className="text-xs text-teal-400 font-semibold animate-pulse">Parsing...</div>}
                {resumeFileName && !parsingResume && (
                  <div className="ml-auto text-xs text-teal-400 font-mono font-semibold">{resumeFileName}</div>
                )}
              </div>
            </div>

            {/* JD Paste Area */}
            <div className="space-y-2">
              <label htmlFor="jobDescriptionSetup" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Target Role Job Description
              </label>
              <textarea
                id="jobDescriptionSetup"
                value={jobDescription}
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                className="h-36 w-full resize-none rounded-lg border border-white/5 bg-[#090d12]/80 p-4 text-xs leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/50 font-mono"
                placeholder="Paste target job descriptions, core stacks, responsibilities, or must-have requirements here..."
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Paste at least 80 characters of text to initialize tailored telemetry assessment questions.
              </p>
            </div>

            {/* Back & Launch buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 rounded-lg border border-white/5 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 transition"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white py-3 text-xs font-bold uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(124,58,237,0.25)]"
              >
                {generating ? "Calibrating Room..." : "Begin Mock Session"}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
