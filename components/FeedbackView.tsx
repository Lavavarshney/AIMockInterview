"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnswerRecord, ExpertAnswerRewrite, NonVerbalMetrics } from "@/lib/types";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type ReportMode = "manager" | "detailed";

type FeedbackViewProps = {
  feedback: string;
  answers: AnswerRecord[];
  expertAnswerRewrites: ExpertAnswerRewrite[];
  nonVerbalMetrics?: NonVerbalMetrics;
  onReset: () => void;
};

export function FeedbackView({ feedback, answers, expertAnswerRewrites, nonVerbalMetrics, onReset }: FeedbackViewProps) {
  const [mode, setMode] = useState<ReportMode>("manager");
  const [copyLabel, setCopyLabel] = useState("Copy Report");
  const speech = useSpeechSynthesis();

  const screenshots = answers.filter((answer) => answer.screenshot);
  const answerInsights = useMemo(
    () => answers.map((answer, index) => getAnswerInsight(answer, index)),
    [answers]
  );

  const overallConfidence =
    answerInsights.length > 0
      ? Math.round(answerInsights.reduce((total, insight) => total + insight.score, 0) / answerInsights.length)
      : 0;

  const weakAnswers = [...answerInsights].sort((left, right) => left.score - right.score).slice(0, 2);
  const followUps = weakAnswers.map((insight) => insight.followUp);
  const topSignals = [...answerInsights].sort((left, right) => right.score - left.score).slice(0, 2);
  const recommendation = getRecommendation(overallConfidence, weakAnswers.length);
  const managerSummary = buildManagerSummary(recommendation, overallConfidence, answerInsights, weakAnswers);

  async function handlePlayAnswer(text: string) {
    try {
      await speech.speak(text);
    } catch {
      /* ignore */
    }
  }

  async function handleCopyAllFollowUps() {
    if (!followUps.length) return;
    const payload = followUps.join("\n\n");
    await navigator.clipboard.writeText(payload);
  }

  async function handleCopyReport() {
    await navigator.clipboard.writeText(feedback);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy Report"), 1500);
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

  const markdownComponents = {
    table({ children }: { children: React.ReactNode }) {
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-white/5 bg-slate-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <table className="min-w-full border-collapse text-left text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }: { children: React.ReactNode }) {
      return <thead className="bg-white/5 text-[10px] uppercase tracking-[0.16em] text-slate-400">{children}</thead>;
    },
    th({ children }: { children: React.ReactNode }) {
      return <th className="border-b border-white/5 px-4 py-3 font-semibold text-slate-200">{children}</th>;
    },
    td({ children }: { children: React.ReactNode }) {
      return <td className="border-b border-white/5 px-4 py-3 align-top text-slate-300">{children}</td>;
    },
    tr({ children }: { children: React.ReactNode }) {
      return <tr className="odd:bg-white/[0.01] hover:bg-white/[0.03] transition-colors">{children}</tr>;
    }
  };

  return (
    <section className="space-y-8 animate-fade-in">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-teal-400">Evaluation Hub</p>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">Assessment Dashboard</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="rounded-md border border-white/5 bg-slate-900/60 p-0.5 flex">
            <button
              type="button"
              onClick={() => setMode("manager")}
              className={`rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "manager"
                  ? "bg-teal-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Summary Brief
            </button>
            <button
              type="button"
              onClick={() => setMode("detailed")}
              className={`rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                mode === "detailed"
                  ? "bg-teal-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Detailed Report
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => void handleCopyReport()}
            className="rounded-md border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition"
          >
            {copyLabel}
          </button>
          
          <button
            type="button"
            onClick={handleDownloadReport}
            className="rounded-md border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition"
          >
            Download Markdown
          </button>
          
          <button
            type="button"
            onClick={onReset}
            className="rounded-md bg-teal-400 hover:bg-teal-300 text-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Reset Session
          </button>
        </div>
      </div>

      {/* KPI Highlight Matrices */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rec Card */}
        <div className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 ${recommendation.tint} shadow-md`}>
          <div>
            <span className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">Consensus Call</span>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{recommendation.label}</p>
          </div>
          <span className="text-xs opacity-85 leading-relaxed">{recommendation.summary}</span>
        </div>

        {/* Confidence Meter Card */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Competency Rating</span>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">{overallConfidence}%</p>
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full transition-all duration-1000" style={{ width: `${overallConfidence}%` }} />
            </div>
            <p className="text-[10px] text-slate-500">Heuristic metric based on answer specification and depth.</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Session Content</span>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">{answers.length}</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard questions answered with visual screenshot captures included for coding assessments.
          </p>
        </div>

        {/* Replay Details */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Webcam Metrics</span>
            <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              {nonVerbalMetrics && nonVerbalMetrics.samples > 0 ? `${nonVerbalMetrics.eyeContactPercent}%` : "--"}
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eye-contact telemetry logged locally during verbal speech simulation phases.
          </p>
        </div>
      </div>

      {/* Main Column Breakdown */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        
        {/* Left Side: Hiring Manager readout */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Briefing Note</span>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Executive Readout</h3>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{managerSummary}</p>

          {/* Strengths & Risks */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-teal-400 font-bold">Key Strengths</span>
              <ul className="space-y-2">
                {topSignals.length ? (
                  topSignals.map((insight) => (
                    <li key={`${insight.answer.questionId}-signal`} className="rounded-lg border border-teal-500/10 bg-teal-500/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-200">
                      {insight.note}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-slate-400">No session metrics available</li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold">Identified Risks</span>
              <ul className="space-y-2">
                {weakAnswers.length ? (
                  weakAnswers.map((insight) => (
                    <li key={`${insight.answer.questionId}-risk`} className="rounded-lg border border-rose-500/10 bg-rose-500/[0.02] px-4 py-3 text-xs leading-relaxed text-slate-200">
                      {insight.note}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-white/5 bg-white/[0.01] px-4 py-3 text-xs text-slate-400">No risks identified</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Follow-up generator */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Calibration Exercise</span>
                <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Weakness Probing Exercises</h3>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyAllFollowUps()}
                disabled={!followUps.length}
                className="rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-200 transition disabled:opacity-40"
              >
                Copy All Exercises
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Targeted training tasks compiled specifically based on weaker elements identified in the interview.
            </p>

            <div className="space-y-3 pt-2">
              {followUps.length ? (
                followUps.map((followUp, index) => (
                  <div key={`${followUp}-${index}`} className="rounded-lg border border-white/5 bg-slate-950/40 px-4 py-3 text-xs leading-relaxed text-slate-300">
                    <p className="text-[9px] uppercase tracking-widest text-teal-400 font-bold mb-1">PROBE EXERCISE {index + 1}</p>
                    <p className="text-slate-200">{followUp}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-white/5 bg-white/[0.01] p-4 text-xs text-slate-500 text-center">
                  Calibration exercises populate automatically when answers are submitted.
                </div>
              )}
            </div>
          </div>

          {/* Heuristic scoring disclaimer */}
          <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4 text-[11px] leading-relaxed text-slate-400 mt-4">
            The confidence indicator is computed via local evaluation rules. This scoring methodology validates contextual specificity, technical terminology integration, and screen-sharing data.
          </div>
        </div>

      </div>

      {/* Scorecard Replay Table */}
      <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Data Replay</span>
          <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Question Scorecard & Replays</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-400 w-12">#</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Assessment Question</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Response Verification</th>
                <th className="px-4 py-3 font-semibold text-slate-400 w-32">Screenshot</th>
                <th className="px-4 py-3 font-semibold text-slate-400 w-44">Telemetry Node</th>
                <th className="px-4 py-3 font-semibold text-slate-400 w-24 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {answerInsights.length ? (
                answerInsights.map((insight, index) => (
                  <tr key={insight.answer.questionId} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-4 text-slate-500 font-semibold">{index + 1}</td>
                    <td className="px-4 py-4 space-y-1">
                      <p className="font-semibold text-slate-200 leading-relaxed max-w-sm">{insight.answer.question}</p>
                      <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-400 uppercase">
                        {insight.answer.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <details className="group">
                        <summary className="cursor-pointer list-none text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1">
                          View Answer Transcript
                          <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-slate-300 max-w-md leading-relaxed border-l-2 border-white/10 pl-3 italic">
                          {insight.answer.answer}
                        </p>
                      </details>
                      
                      <button
                        type="button"
                        onClick={() => void handlePlayAnswer(insight.answer.answer)}
                        disabled={!speech.isSupported}
                        className="rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-300 transition"
                      >
                        Play Audio Synthesis
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      {insight.answer.screenshot ? (
                        <span className="inline-block bg-teal-500/10 border border-teal-400/20 text-teal-400 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                          Captured
                        </span>
                      ) : (
                        <span className="inline-block bg-white/5 border border-white/10 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400 leading-relaxed max-w-[180px]">{insight.note}</td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-teal-400 text-sm">{insight.score}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-500 text-center italic" colSpan={6}>
                    Assessment metrics require a completed interview session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expert Comparison Matrix */}
      {expertAnswerRewrites.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Rewrite Studio</span>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Expert Side-by-Side Comparisons</h3>
          </div>

          <div className="space-y-6">
            {expertAnswerRewrites.map((rewrite, index) => (
              <div key={`${rewrite.questionId}-${index}`} className="border-b border-white/5 pb-6 last:border-b-0 last:pb-0 space-y-3.5">
                <h4 className="text-xs font-bold text-white leading-relaxed">
                  {index + 1}. {rewrite.question}
                </h4>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4 space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Candidate Transcript</span>
                    <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">{rewrite.originalAnswer}</p>
                  </div>
                  
                  <div className="rounded-lg border border-teal-500/10 bg-teal-500/[0.02] p-4 space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-teal-400 font-bold">Senior-Level Refinement</span>
                    <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{rewrite.expertAnswer}</p>
                  </div>
                </div>

                {rewrite.missingSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mr-1">Missing Signals:</span>
                    {rewrite.missingSignals.map((signal) => (
                      <span key={signal} className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-verbal telemetry gauge block */}
      {nonVerbalMetrics && nonVerbalMetrics.samples > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Postural Analytics</span>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Non-Verbal Telemetry Metrics</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <MetricProgressCard label="Eye Contact" value={nonVerbalMetrics.eyeContactPercent} theme="teal" />
            <MetricProgressCard label="Looking Away" value={nonVerbalMetrics.lookingAwayPercent} theme="amber" />
            <MetricProgressCard label="Face Presence" value={nonVerbalMetrics.faceVisiblePercent} theme="teal" />
            <MetricProgressCard label="Positivity Index" value={nonVerbalMetrics.expressionPositivity} theme="teal" />
          </div>
        </div>
      )}

      {/* Narrative markdown scorecard */}
      <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-teal-400">Report Ledger</span>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">Full Narrative Report Ledger</h3>
          </div>
          <span className="text-xs text-slate-400">
            {mode === "manager" ? "Collapsed in summary brief mode." : "Expanded in detailed mode."}
          </span>
        </div>

        <details className="rounded-lg border border-white/5 bg-slate-950/40 p-4 transition-all duration-300" open={mode === "detailed"}>
          <summary className="cursor-pointer list-none text-xs font-semibold text-teal-400 hover:text-teal-300 tracking-wide uppercase select-none">
            Toggle Detailed Narrative Text
          </summary>
          <article className="prose prose-invert prose-headings:text-white prose-a:text-teal-400 prose-strong:text-white mt-5 max-w-none prose-table:my-0 prose-thead:border-b-0 prose-th:text-left prose-td:text-left text-xs leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
              {feedback}
            </ReactMarkdown>
          </article>
        </details>
      </div>

      {/* Captured screenshots timeline */}
      {screenshots.length > 0 && (
        <div className="space-y-4">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Visual Artifact Ledger</span>
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

// Progress metrics gauge display
function MetricProgressCard({ label, value, theme }: { label: string; value: number; theme: "teal" | "amber" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950/40 p-4 space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <span className="text-lg font-bold text-white font-mono">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            theme === "teal" ? "bg-teal-400" : "bg-amber-400"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function getAnswerInsight(answer: AnswerRecord, index: number) {
  const text = answer.answer.trim();
  const lower = text.toLowerCase();
  let score = 40 + index * 2;

  if (text.length > 24) score += 8;
  if (text.length > 80) score += 12;
  if (text.length > 180) score += 8;

  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  if (sentenceCount >= 2) score += 8;
  if (sentenceCount >= 4) score += 4;

  if (/for example|for instance|specifically|measur(e|ed)|result|outcome|tradeoff|because|so that/i.test(text)) {
    score += 10;
  }

  if (answer.screenshot) score += 8;

  if (answer.type === "technical" && /api|code|test|cache|latency|state|component|database|query|deploy|bug/i.test(text)) {
    score += 8;
  }

  if (answer.type === "behavioral" && /team|stakeholder|feedback|conflict|ownership|collaborat|influenc|resolved/i.test(text)) {
    score += 8;
  }

  if (answer.type === "system_design" && /scale|reliab|monitor|failure|queue|shard|replica|consistency|throughput/i.test(text)) {
    score += 8;
  }

  if (/i don't know|not sure|maybe|sort of|kind of|whatever/i.test(lower)) {
    score -= 16;
  }

  if (text.length < 20) score -= 12;

  score = clamp(score, 0, 100);

  return {
    answer,
    score,
    note: buildAnswerNote(answer, score),
    followUp: buildFollowUpQuestion(answer, score)
  };
}

function buildAnswerNote(answer: AnswerRecord, score: number) {
  if (score >= 85) return `Strong ${answer.type.replace("_", " ")} competency signal with concrete details.`;
  if (score >= 70) return `Good structure, but could emphasize more architectural depths.`;
  if (score >= 55) return `Adequate response with thin details. Expand specific technical metrics.`;
  return `Underdeveloped response. Lacks clear structural framework and trade-off considerations.`;
}

function buildFollowUpQuestion(answer: AnswerRecord, score: number) {
  const trimmedQuestion = truncate(answer.question, 72);
  const shortAnswer = truncate(answer.answer, 90);

  if (answer.type === "technical") {
    if (score >= 70) {
      return `You stated “${shortAnswer}”. What alternate designs were available, and how did you measure performance tradeoffs?`;
    }

    return `Can you explain the exact engineering challenges behind the “${trimmedQuestion}” problem with a real world case?`;
  }

  if (answer.type === "behavioral") {
    if (score >= 70) {
      return `Can you highlight your direct team contribution, and explain the key metrics measuring project success?`;
    }

    return `What was the exact resolution mechanism you chose, and what core lesson did your team obtain?`;
  }

  if (score >= 70) {
    return `How would this architecture scale under a 10x query load or a persistent microservice outage?`;
  }

  return `Can you build on the “${trimmedQuestion}” answer by explicitly explaining scaling constraints, replication rules, and logs?`;
}

function getRecommendation(score: number, weakCount: number) {
  if (score >= 82 && weakCount === 0) {
    return {
      label: "Strong Hire",
      tint: "border-teal-400/20 bg-teal-500/10 text-teal-400",
      summary: "Candidate displays strong analytical layout capabilities, concrete contextual indicators, and thorough technical details."
    };
  }

  if (score >= 68) {
    return {
      label: "Lean Hire",
      tint: "border-sky-400/20 bg-sky-500/10 text-sky-400",
      summary: "Candidate exhibits adequate competency across multiple questions, but shows slight gaps in specific detail depths."
    };
  }

  if (score >= 55) {
    return {
      label: "Borderline",
      tint: "border-amber-400/20 bg-amber-500/10 text-amber-400",
      summary: "Candidate answers display highly variable depth indicators. Additional deep technical scoping is recommended."
    };
  }

  return {
    label: "No Hire",
    tint: "border-rose-400/20 bg-rose-500/10 text-rose-400",
    summary: "Responses lacked required depth structures or technical specifics. Core architectural signal is thin."
  };
}

function buildManagerSummary(
  recommendation: ReturnType<typeof getRecommendation>,
  score: number,
  answerInsights: ReturnType<typeof getAnswerInsight>[],
  weakAnswers: ReturnType<typeof getAnswerInsight>[]
) {
  if (!answerInsights.length) {
    return "Insufficient data captured during this session to produce a hiring consensus brief.";
  }

  const strengths = answerInsights.filter((insight) => insight.score >= 70).length;
  const risks = weakAnswers.length;
  return `${recommendation.summary} Overall consensus rating compiles at ${score}%, with ${strengths} strength signal indicators and ${risks} risk indicators recorded in session.`;
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
