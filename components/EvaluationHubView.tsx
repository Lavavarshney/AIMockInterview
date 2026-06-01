"use client";

import { useInterview } from "@/context/InterviewContext";
import { scoreInterview } from "@/lib/scoring";
import type { CompletedInterview } from "@/lib/types";
import { useState } from "react";

type InsightCategory = "strengths" | "risks" | "suggestions" | "history";

export function EvaluationHubView() {
  const { state, dispatch } = useInterview();
  const [activeInsightTab, setActiveInsightTab] = useState<InsightCategory>("strengths");
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const totalSessions = state.history.length;
  const hasHistory = totalSessions > 0;

  // Use values from the most recent mock session if history exists
  const latestSession = hasHistory ? state.history[0] : null;
  const latestPerformance = latestSession ? scoreInterview(latestSession.answers) : null;

  const overallScore = latestSession ? latestSession.score : 0;
  const commScore = latestPerformance?.communication || 0;
  const techScore = latestPerformance?.domain || 0;
  const clarityScore = latestPerformance?.articulation || 0;
  const answeredCount = latestSession?.answers.length || 0;
  const screenshotCount = latestSession?.answers.filter((answer) => answer.screenshot).length || 0;
  const roleLabel = latestSession?.role || state.profile.targetRole || "target role";

  function handleStartNew() {
    dispatch({ type: "SET_VIEW", payload: "setup" });
  }

  function handleViewReport(report: CompletedInterview) {
    dispatch({
      type: "LOAD_REPORT",
      payload: {
        feedback: report.feedback,
        answers: report.answers,
        expertAnswerRewrites: report.expertAnswerRewrites
      }
    });
    dispatch({ type: "SET_VIEW", payload: "report" });
  }

  function toggleCategory(cat: string) {
    setOpenCategory(openCategory === cat ? null : cat);
  }

  // If no mock history records exist, show clean empty state
  if (!hasHistory) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 space-y-6 text-center animate-fade-in">
        <div className="rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-8 space-y-6 shadow-2xl flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">No evaluations registered</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Unlock personalized scorecards and targeted feedback lists by completing your first mock session.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartNew}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          >
            Start Evaluation
          </button>
        </div>
      </div>
    );
  }

  const feedbackPreview = latestSession?.feedback
    .split("\n")
    .map((line) => line.replace(/^[-*#\s]+/, "").trim())
    .filter((line) => line.length > 30)
    .slice(0, 3) || [];

  const strengthsItems = [
    `${answeredCount} answer${answeredCount === 1 ? "" : "s"} captured for ${roleLabel}.`,
    screenshotCount > 0
      ? `${screenshotCount} coding screenshot${screenshotCount === 1 ? "" : "s"} included in the evaluation.`
      : "Transcript-only evaluation recorded for this session.",
    ...feedbackPreview.slice(0, 1)
  ];

  const risksItems = [
    overallScore < 70
      ? "Latest readiness score is below 70%, so review the full report before the next attempt."
      : "Use the full report to find the most specific gaps from this attempt.",
    "Voice transcription can miss words; edit captured answers before submitting for best scoring.",
    ...feedbackPreview.slice(1, 2)
  ];

  const suggestionsItems = [
    "Open the latest report for per-question feedback and expert answer rewrites.",
    "Run another mock with the same resume and JD to compare trend changes.",
    ...feedbackPreview.slice(2, 3)
  ];

  const historyItems = state.history.map(
    (h) => `Session completed on ${h.date} with a scorecard score of ${h.score}%.`
  );

  const activeInsightsList =
    activeInsightTab === "strengths"
      ? strengthsItems
      : activeInsightTab === "risks"
      ? risksItems
      : activeInsightTab === "suggestions"
      ? suggestionsItems
      : historyItems;

  const visibleInsights = showAllInsights ? activeInsightsList : activeInsightsList.slice(0, 2);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400">Readiness Engine</p>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">Evaluation Hub</h2>
          <p className="text-xs text-slate-400 mt-1">Track mock assessments and focus your interview training.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW", payload: "history" })}
            className="rounded-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition"
          >
            View Past Reports
          </button>
          
          <button
            type="button"
            onClick={handleStartNew}
            className="rounded-md bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-4 py-2 text-xs font-semibold uppercase tracking-widest transition shadow-[0_0_15px_rgba(124,58,237,0.2)]"
          >
            Start New Evaluation
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <SnapshotCard
          label="Overall Readiness"
          value={`${overallScore}%`}
          status={overallScore >= 75 ? "Strong" : "Needs Work"}
          insight="Consistent competency recorded across active categories."
        />
        
        <SnapshotCard
          label="Communication"
          value={`${commScore}%`}
          status={commScore >= 78 ? "Strong" : "Needs Work"}
          insight="Derived from behavioral answer evidence."
        />
        
        <SnapshotCard
          label="Technical Accuracy"
          value={`${techScore}%`}
          status={techScore >= 78 ? "Strong" : "Needs Work"}
          insight="Derived from technical and system-design answer coverage."
        />
        
        <SnapshotCard
          label="Confidence & Clarity"
          value={`${clarityScore}%`}
          status={clarityScore >= 78 ? "Strong" : "Needs Work"}
          insight="Derived from structure, length, certainty, and specificity."
        />

      </div>

      {/* Recommended Practice */}
      <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold block">Next Action Prompt</span>
          <h4 className="text-md font-bold text-white tracking-tight">Structured Technical Practice Drill</h4>
          <p className="text-xs text-slate-300 leading-normal">
            Take another focused mock simulation for {roleLabel} and compare it with your latest report.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="w-full sm:w-auto rounded bg-violet-400 hover:bg-violet-300 text-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(124,58,237,0.2)] self-center"
        >
          Start Recommended Practice
        </button>
      </div>

      {/* Grid: Categories Progress Accordions & Recent List */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        
        {/* Categories Grid */}
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Category Competencies</span>
          
          <div className="grid gap-4 sm:grid-cols-2">
            
            <CategoryCard
              label="HR / Behavioral"
              pill={overallScore >= 75 ? "Strong" : "Needs Work"}
              description="Based on behavioral answers in the latest completed interview."
              open={openCategory === "hr"}
              onToggle={() => toggleCategory("hr")}
              insight="Review the report for STAR structure, ownership, impact, and clarity in behavioral answers."
            />
            
            <CategoryCard
              label="Technical Rounds"
              pill={techScore >= 75 ? "Strong" : "Needs Work"}
              description="Based on technical answers in the latest completed interview."
              open={openCategory === "tech"}
              onToggle={() => toggleCategory("tech")}
              insight="Review the report for implementation detail, tradeoffs, terminology, and role-specific depth."
            />

            <CategoryCard
              label="DSA & Algorithms"
              pill="Not Attempted"
              description="No separate DSA-only session has been recorded."
              open={openCategory === "dsa"}
              onToggle={() => toggleCategory("dsa")}
              insight="Start a DSA-focused interview if this job requires algorithmic coding rounds."
            />

            <CategoryCard
              label="System Architecture"
              pill={techScore >= 75 ? "Strong" : "Needs Work"}
              description="Based on system design coverage in the latest interview."
              open={openCategory === "sys"}
              onToggle={() => toggleCategory("sys")}
              insight="Review the system-design answer for APIs, data model, reliability, observability, and scaling tradeoffs."
            />

          </div>
        </div>

        {/* Dynamic Accordion insights */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {(["strengths", "risks", "suggestions"] as InsightCategory[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveInsightTab(tab);
                    setShowAllInsights(false);
                  }}
                  className={`pb-2.5 text-[10px] font-bold uppercase tracking-wider border-b-2 mr-4 transition ${
                    activeInsightTab === tab
                      ? "border-violet-400 text-violet-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List */}
            <ul className="space-y-2.5">
              {visibleInsights.map((item, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs text-slate-300 items-start leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

          </div>

          {activeInsightsList.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllInsights(!showAllInsights)}
              className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase tracking-wider text-left pt-2"
            >
              {showAllInsights ? "Show Less" : "View More Insights"}
            </button>
          )}
        </div>

      </div>

      {/* Recent Evaluations table */}
      <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Ledger Listings</span>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <tbody className="divide-y divide-white/5">
              {state.history.slice(0, 3).map((session) => (
                <tr key={session.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{session.date}</td>
                  <td className="py-3 px-4 text-slate-200">{session.role}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-400 uppercase">
                      {session.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-teal-400">{session.score}%</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleViewReport(session)}
                      className="rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-300 transition"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Snapshot card
function SnapshotCard({ label, value, status, insight }: { label: string; value: string; status: string; insight: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d131a]/85 hover:border-violet-500/20 backdrop-blur-md p-5 space-y-3 shadow-md hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold group-hover:text-violet-400 transition-colors">{label}</span>
        <span
          className={`text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase border ${
            status === "Strong"
              ? "bg-teal-500/10 border-teal-500/20 text-teal-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-500 leading-relaxed">{insight}</p>
    </div>
  );
}

// Category progress card
function CategoryCard({
  label,
  pill,
  description,
  open,
  onToggle,
  insight
}: {
  label: string;
  pill: "Strong" | "Needs Work" | "Not Attempted";
  description: string;
  open: boolean;
  onToggle: () => void;
  insight: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d131a]/85 hover:border-violet-500/20 backdrop-blur-md p-5 space-y-3 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline gap-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-violet-400 transition-colors">{label}</h4>
          <span
            className={`text-[7px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase border ${
              pill === "Strong"
                ? "bg-teal-500/10 border-teal-500/20 text-teal-400"
                : pill === "Needs Work"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-slate-500/10 border-slate-500/20 text-slate-400"
            }`}
          >
            {pill}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">{description}</p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-full rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-300 transition flex items-center justify-center gap-1.5"
        >
          {open ? "Close Assessment" : "Open Assessment"}
          <span>{open ? "▲" : "▼"}</span>
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded bg-slate-950/50 border border-white/5 p-3 text-[10px] leading-relaxed text-slate-300 italic animate-slide-down">
          {insight}
        </div>
      )}
    </div>
  );
}
