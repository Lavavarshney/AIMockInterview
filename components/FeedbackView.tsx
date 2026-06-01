"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { performanceLabel, scoreInterview } from "@/lib/scoring";
import type { AnswerRecord, ExpertAnswerRewrite, NonVerbalMetrics } from "@/lib/types";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type FeedbackViewProps = {
  feedback: string;
  answers: AnswerRecord[];
  expertAnswerRewrites: ExpertAnswerRewrite[];
  nonVerbalMetrics?: NonVerbalMetrics;
  onReset: () => void;
};

// Seniority mapping helper
function getSeniorityIndex(score: number): number {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 75) return 3;
  if (score < 90) return 4;
  return 5;
}

const SENIORITY_TIERS = [
  "Incomplete Response",
  "Entry-Level",
  "Developing",
  "Professional",
  "Advanced Professional",
  "Expert"
];

const TIER_COLORS = {
  0: "text-rose-400",
  1: "text-amber-400",
  2: "text-emerald-400",
  3: "text-violet-400",
  4: "text-fuchsia-400",
  5: "text-pink-400"
};

export function FeedbackView({
  feedback,
  answers,
  expertAnswerRewrites,
  nonVerbalMetrics,
  onReset
}: FeedbackViewProps) {
  const [activeQuestionTab, setActiveQuestionTab] = useState(0);
  const [showRecommendedAnswer, setShowRecommendedAnswer] = useState<Record<number, boolean>>({});
  const speech = useSpeechSynthesis();

  // Deduplicated list of screenshots
  const screenshots = answers.filter((answer) => answer.screenshot);

  // Compute question-by-question metrics
  const answerInsights = useMemo(() => {
    return scoreInterview(answers).answerScores.map((insight) => {
      const answer = insight.answer;
      const matchingRewrite = expertAnswerRewrites.find(
        (r) => String(r.questionId) === String(answer.questionId)
      );

      return {
        answer,
        score: insight.score,
        whatWentWell: insight.strengths,
        whatCouldBeBetter: insight.gaps,
        missingTerminologies: matchingRewrite?.missingSignals?.length
          ? matchingRewrite.missingSignals
          : insight.missingSignals,
        matchingRewrite
      };
    });
  }, [answers, expertAnswerRewrites]);

  // Overall calculations
  const performance = useMemo(() => scoreInterview(answers), [answers]);
  const overallConfidence = performance.overall;
  const domainScore = performance.domain;
  const articulationScore = performance.articulation;
  const communicationScore = performance.communication;

  const activeInsight = answerInsights[activeQuestionTab];
  const activeTimelineIndex = getSeniorityIndex(overallConfidence);

  async function handlePlayAnswer(text: string) {
    try {
      await speech.speak(text);
    } catch {
      /* ignore */
    }
  }

  function handleCopyReport() {
    void navigator.clipboard.writeText(feedback);
  }

  function handleDownloadReport() {
    const blob = new Blob([feedback], { type: "text/markdown;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "hireflow-feedback.md";
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <section className="space-y-8 animate-fade-in text-slate-100 max-w-7xl mx-auto">
      {/* Top Banner Toolbar matching REMASTO */}
      <div className="rounded-2xl border border-white/5 bg-[#121820]/80 p-6 flex flex-wrap items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
            <span>Position: <strong className="text-white">Software Engineer</strong></span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Round: <strong className="text-white">Role Related</strong></span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Practiced On: <strong className="text-white">{new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</strong></span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Answered: <strong className="text-white">{performance.answeredCount}</strong></span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>Skipped: <strong className="text-white">{performance.skippedCount}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 transition"
          >
            Try Same Interview Again
          </button>
          
          <button
            type="button"
            onClick={handleCopyReport}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(124,58,237,0.2)]"
          >
            Report
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(124,58,237,0.2)]"
          >
            Certificate
          </button>
        </div>
      </div>

      {/* Seniority Timeline Panel */}
      <div className="rounded-2xl border border-white/5 bg-[#121820]/80 p-6 shadow-xl space-y-6">
        <div className="flex flex-col items-center space-y-2 relative">
          {/* Dynamic You Are Here marker row */}
          <div className="w-full grid grid-cols-6 text-center">
            {SENIORITY_TIERS.map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                {activeTimelineIndex === i ? (
                  <div className="flex flex-col items-center animate-bounce">
                    <span className="text-[10px] uppercase tracking-widest text-violet-400 font-extrabold bg-violet-400/10 px-2 py-0.5 rounded border border-violet-500/20">You Are Here</span>
                    <span className="text-lg text-violet-400 leading-none mt-1">↓</span>
                  </div>
                ) : (
                  <div className="h-7" />
                )}
              </div>
            ))}
          </div>

          {/* Timeline segments row */}
          <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex">
            {SENIORITY_TIERS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full border-r border-slate-950 last:border-r-0 transition-all duration-1000 ${
                  i <= activeTimelineIndex
                    ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                    : "bg-slate-950"
                }`}
              />
            ))}
          </div>

          {/* Timeline labels row */}
          <div className="w-full grid grid-cols-6 text-center text-[10px] font-bold uppercase tracking-wider pt-2">
            {SENIORITY_TIERS.map((tier, i) => (
              <span
                key={tier}
                className={`px-1 transition-colors duration-500 ${
                  activeTimelineIndex === i ? TIER_COLORS[i as keyof typeof TIER_COLORS] + " font-extrabold" : "text-slate-500"
                }`}
              >
                {tier}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Four Doughnut Progress Gauges */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CircularProgress
          percent={overallConfidence}
          label={SENIORITY_TIERS[activeTimelineIndex]}
          subtitle="Interview Level"
          strokeColor="#10b981" // Green
        />
        <CircularProgress
          percent={domainScore}
          label={performanceLabel(domainScore)}
          subtitle="Domain Knowledge"
          strokeColor="#f97316" // Orange
        />
        <CircularProgress
          percent={articulationScore}
          label={performanceLabel(articulationScore)}
          subtitle="Articulation"
          strokeColor="#a855f7" // Purple
        />
        <CircularProgress
          percent={communicationScore}
          label={performanceLabel(communicationScore)}
          subtitle="Communication"
          strokeColor="#ec4899" // Pink
        />
      </div>

      {/* Main Breakdown Grid: Left Question Sidebar + Right Question Insights */}
      {answerInsights.length > 0 && activeInsight ? (
        <div className="grid gap-6 lg:grid-cols-[160px_1fr]">
          {/* Left Vertical Question Tab Selector */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5 h-fit">
            {answerInsights.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveQuestionTab(i)}
                className={`flex-shrink-0 w-full rounded-lg py-3 px-4 text-xs font-bold transition-all duration-300 uppercase tracking-widest text-center ${
                  activeQuestionTab === i
                    ? "bg-gradient-to-r from-violet-500/10 to-indigo-600/10 border border-violet-500/30 text-violet-400 shadow-[inset_0_1px_0_rgba(124,58,237,0.05)]"
                    : "border border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]"
                }`}
              >
                Q{i + 1}
              </button>
            ))}
          </div>

          {/* Right Question Details Box */}
          <div className="rounded-2xl border border-white/5 bg-[#121820]/80 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-violet-400 font-extrabold">Question {activeQuestionTab + 1} Details</span>
              <h3 className="text-md font-bold text-white leading-relaxed">{activeInsight.answer.question}</h3>
              <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-400 uppercase">
                {activeInsight.answer.type.replace("_", " ")}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* What went well */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold">What went well</h4>
                <ul className="space-y-2">
                  {activeInsight.whatWentWell.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-relaxed items-start">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What could be better */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-extrabold">What could be better</h4>
                <ul className="space-y-2">
                  {activeInsight.whatCouldBeBetter.map((item, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-300 leading-relaxed items-start">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Terminologies inside grey-shaded card container */}
            <div className="rounded-xl border border-white/5 bg-slate-950/60 p-4 space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Missing Terminologies</h4>
              <div className="flex flex-wrap gap-2">
                {activeInsight.missingTerminologies.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-900 border border-white/5 px-3 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* GET RECOMMENDED ANSWER Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  setShowRecommendedAnswer((prev) => ({
                    ...prev,
                    [activeQuestionTab]: !prev[activeQuestionTab]
                  }))
                }
                className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(124,58,237,0.2)]"
              >
                {showRecommendedAnswer[activeQuestionTab] ? "Hide Recommended Answer" : "Get Recommended Answer"}
              </button>
            </div>

            {/* Recommended Answer Side-by-Side Comparison Container */}
            {showRecommendedAnswer[activeQuestionTab] && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-white/5 animate-fade-in">
                {/* Candidate Transcript */}
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 space-y-2">
                  <span className="text-[8px] uppercase tracking-widest text-slate-400 font-extrabold block">Your Answer Transcript</span>
                  <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap italic">
                    &quot;{activeInsight.answer.answer || "No response recorded."}&quot;
                  </p>
                </div>

                {/* Expert Answer */}
                <div className="rounded-xl border border-violet-500/10 bg-violet-500/[0.02] p-4 space-y-2">
                  <span className="text-[8px] uppercase tracking-widest text-violet-400 font-extrabold block">Senior-Level Refinement</span>
                  <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-medium">
                    {activeInsight.matchingRewrite?.expertAnswer ||
                      `Here is an refined approach: Quantify your results and establish clear technical design parameters. Structure your argument by outlining: 1) The technical challenges of the context round. 2) The exact steps you took with React, Next.js, and scaling protocols. 3) The concrete business metric outcome (e.g. 'reduced latency by 40%').`}
                  </p>
                </div>
              </div>
            )}

            {/* Expandable Your Response transcript drawer */}
            <details className="group border-t border-white/5 pt-4">
              <summary className="cursor-pointer list-none text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 uppercase tracking-wider select-none">
                Your Response Details
                <span className="text-[8px] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-4 space-y-3 animate-fade-in">
                <p className="text-xs leading-relaxed text-slate-300 border-l-2 border-white/10 pl-3 italic whitespace-pre-wrap">
                  {activeInsight.answer.answer}
                </p>
                
                <button
                  type="button"
                  onClick={() => void handlePlayAnswer(activeInsight.answer.answer)}
                  disabled={!speech.isSupported}
                  className="rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 transition"
                >
                  Play Audio Synthesis
                </button>
              </div>
            </details>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#121820]/80 p-8 text-center text-slate-500 text-xs italic">
          No answer logs captured in this session.
        </div>
      )}

      {/* Captured screenshots timeline */}
      {screenshots.length > 0 && (
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">Visual Artifact Ledger</span>
          <div className="grid gap-4 md:grid-cols-2">
            {screenshots.map((answer, index) => (
              <figure key={answer.questionId} className="rounded-xl border border-white/5 bg-[#121820]/80 p-4 space-y-3 shadow-lg">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={answer.screenshot}
                    alt={`Coding screenshot ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <figcaption className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-200">Question {index + 1}:</span> {answer.question}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Circular progress meter widget
function CircularProgress({
  percent,
  label,
  subtitle,
  strokeColor
}: {
  percent: number;
  label: string;
  subtitle: string;
  strokeColor: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-5 bg-[#121820]/80 border border-white/5 rounded-2xl shadow-xl space-y-3 text-center">
      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">{subtitle}</span>
      <div className="relative h-28 w-28 flex items-center justify-center">
        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-800/40"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth="7"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center px-2">
          <span className="text-[10px] font-extrabold text-white leading-tight uppercase tracking-wider">{label}</span>
          <span className="text-[9px] text-slate-500 font-mono font-bold mt-0.5">{percent}%</span>
        </div>
      </div>
    </div>
  );
}
