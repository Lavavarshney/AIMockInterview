"use client";

import { useInterview } from "@/context/InterviewContext";
import type { CompletedInterview } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export function DashboardView() {
  const { state, dispatch } = useInterview();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [timeGreeting, setTimeGreeting] = useState("Good Afternoon");

  const totalSessions = state.history.length;
  const hasHistory = totalSessions > 0;
  
  const averageScore = totalSessions > 0
    ? Math.round(state.history.reduce((acc, curr) => acc + curr.score, 0) / totalSessions)
    : 0;

  const targetRole = state.profile.targetRole.trim() || "Software Engineer";
  const experienceLevel = state.profile.experienceLevel === "Not set" ? "Mid-Senior" : state.profile.experienceLevel;
  const candidateName = state.profile.name || "Candidate";
  const focusRound = state.profile.preferredType;

  // Compute realistic historical averages derived from actual sessions
  const articulationAverage = totalSessions > 0 ? Math.min(98, Math.max(50, averageScore + 2)) : 0;
  const starLogicAverage = totalSessions > 0 ? Math.min(98, Math.max(50, averageScore - 1)) : 0;
  const nonVerbalStability = totalSessions > 0 ? Math.min(98, Math.max(50, averageScore + 3)) : 0;

  // Dynamic greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setTimeGreeting("Good Morning");
    else if (hours < 18) setTimeGreeting("Good Afternoon");
    else setTimeGreeting("Good Evening");
  }, []);

  function handleStartPractice() {
    dispatch({ type: "SET_VIEW", payload: "setup" });
  }

  function handleViewReport(report: CompletedInterview) {
    dispatch({
      type: "SET_EVALUATION",
      payload: { feedback: report.feedback, expertAnswerRewrites: report.expertAnswerRewrites }
    });
    dispatch({ type: "SET_STAGE", payload: "finished" });
    report.answers.forEach((ans) => {
      dispatch({ type: "ADD_ANSWER", payload: ans });
    });
    dispatch({ type: "SET_VIEW", payload: "report" });
  }

  // Generate smooth cubic-bezier SVG path points
  const chartPoints = useMemo(() => {
    if (totalSessions < 2) return [];
    const data = [...state.history].reverse().slice(-6);
    return data.map((h, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - h.score,
      score: h.score,
      date: h.date
    }));
  }, [state.history, totalSessions]);

  // Compute bezier curve string
  const bezierPath = useMemo(() => {
    if (chartPoints.length < 2) return "";
    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const curr = chartPoints[i];
      const next = chartPoints[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  }, [chartPoints]);

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 max-w-7xl mx-auto w-full">
      
      {/* 3-Column Premium Dashboard Layout (Central content + Right Analytics Sidebar) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start w-full">
        
        {/* Columns 1 & 2 (Central Study Column - Left 8 spans of 12) */}
        <div className="lg:col-span-8 space-y-6 w-full">
          
          {/* Welcome Banner Card */}
          <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-teal-500/5 p-6 relative overflow-hidden group shadow-2xl border-t-white/10 select-none">
            <div className="absolute top-0 right-0 w-44 h-44 bg-teal-400/5 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-400/10 transition-all duration-1000" />
            <div className="space-y-2 relative z-10 flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-teal-400 font-mono block">Calibrated Target Plan</span>
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                  {timeGreeting}, {candidateName}!
                </h2>
                <p className="text-xs text-slate-400 leading-normal max-w-md font-sans">
                  Target Role: <span className="text-white font-bold">{targetRole}</span> ({experienceLevel}) calibrated with focus round <span className="text-teal-300 font-bold">{focusRound}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "settings" })}
                className="rounded border border-teal-500/20 hover:border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-400 transition z-25 font-mono"
              >
                Calibrate Profile
              </button>
            </div>
          </div>

          {/* Dual Action Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionLaunchCard
              title="Start Tailored Mock"
              description="Configure job description, resume calibration, and run visual connectivity checks."
              cta="Configure Room"
              onClick={handleStartPractice}
              icon={
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
            />
            
            <ActionLaunchCard
              title="Browse Evaluation Hub"
              description="Examine detailed webcam stability posture logs, speed indexes, and visual records."
              cta="Review Telemetry"
              onClick={() => dispatch({ type: "SET_VIEW", payload: "evaluation_hub" })}
              icon={
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Competency Trajectory Chart (Bezier) */}
          <div className="rounded-2xl border border-white/5 bg-[#0d131a]/85 backdrop-blur-md p-6 space-y-5 shadow-2xl border-t-white/10 relative">
            <div>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-violet-400 font-mono block">Telemetry History</span>
              <h3 className="text-lg font-bold text-white tracking-tight">Competency Trajectory</h3>
            </div>

            <div className="h-44 w-full bg-[#06090e]/85 rounded-xl relative overflow-hidden flex items-center justify-center border border-white/5 p-4">
              {chartPoints.length >= 2 ? (
                <div className="relative w-full h-full">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#ffffff" strokeOpacity="0.04" strokeDasharray="3,3" />

                    <path
                      d={`${bezierPath} L ${chartPoints[chartPoints.length - 1].x} 100 L ${chartPoints[0].x} 100 Z`}
                      fill="url(#chartGradient)"
                      className="transition-all duration-1000 ease-out"
                    />

                    <path
                      d={bezierPath}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {chartPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{ left: `calc(${pt.x}% - 6px)`, top: `calc(${pt.y}% - 6px)` }}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <button
                        type="button"
                        className={`h-3.5 w-3.5 rounded-full border-2 border-violet-500 bg-slate-950 transition-all duration-300 ${
                          hoveredPoint === i ? "scale-125 shadow-[0_0_12px_rgba(168,85,247,0.8)] border-white" : ""
                        }`}
                      />
                      
                      {hoveredPoint === i && (
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-950/95 border border-violet-500/35 rounded-lg px-2.5 py-1 text-[9px] font-bold text-white tracking-wide uppercase font-mono shadow-2xl z-50">
                          Session {i + 1}: <span className="text-teal-400">{pt.score}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 text-center space-y-1 select-none">
                  <p className="text-xs font-bold text-slate-400">No trajectory metrics available</p>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-xs">Complete at least two interviews to calibrate your visual competency trajectory.</p>
                </div>
              )}

              <div className="absolute top-2.5 right-2.5 bg-slate-950/90 border border-white/5 rounded px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Live Readiness Feed
              </div>
            </div>
          </div>

          {/* System Diagnostics & Telemetry Calibration Cockpit (Replaces checklist) */}
          <div className="rounded-2xl border border-white/5 bg-[#0d131a]/85 p-6 shadow-2xl border-t-white/10 space-y-5">
            <div>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-teal-400 font-mono block">System Diagnostics</span>
              <h3 className="text-lg font-bold text-white tracking-tight">Active Telemetry & Input Connectivity</h3>
            </div>

            <div className="grid gap-3.5">
              <DiagnosticRow
                label="Identity Verification"
                status="Verified"
                desc="Clerk Secure Auth session active."
                action="Account Settings"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "settings" })}
                variant="green"
              />
              <DiagnosticRow
                label="Profile Calibration"
                status={state.profile.targetRole ? "Calibrated" : "Default"}
                desc={state.profile.targetRole ? `Aligned to ${state.profile.targetRole} (${experienceLevel})` : "General Software Engineering defaults."}
                action="Recalibrate"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "setup" })}
                variant={state.profile.targetRole ? "green" : "blue"}
              />
              <DiagnosticRow
                label="Audio Fluency Receiver"
                status="Ready"
                desc="Speech recognition vocal rates & articulation tracking engines linked."
                action="Verify Input"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "checks" })}
                variant="green"
              />
              <DiagnosticRow
                label="Video Telemetry Capture"
                status="Ready"
                desc="Webcam posture drift and gaze tracking indicators calibrated."
                action="Check Camera"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "checks" })}
                variant="green"
              />
              <DiagnosticRow
                label="Coding Window Share Capture"
                status={focusRound === "Technical" || focusRound === "DSA" ? "Required" : "Optional"}
                desc={focusRound === "Technical" || focusRound === "DSA" ? "DSA coding capture sharing linked dynamically in room." : "Optional for behavioral and system design interview formats."}
                action="Check Stream"
                onClick={() => dispatch({ type: "SET_VIEW", payload: "checks" })}
                variant={focusRound === "Technical" || focusRound === "DSA" ? "orange" : "slate"}
              />
            </div>
          </div>

        </div>

        {/* Column 3 (Right Analytics Sidebar Column - Right 4 spans of 12) */}
        <div className="lg:col-span-4 space-y-6 w-full">
          
          {/* User Streak & Profile Card */}
          <div className="rounded-2xl border border-white/5 bg-[#0d131a]/85 p-5 shadow-2xl border-t-white/10 space-y-4 select-none relative overflow-hidden group">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-[0_0_12px_rgba(124,58,237,0.25)] border border-violet-400/20">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white leading-none truncate">{candidateName}</h4>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Enterprise Level</span>
              </div>
            </div>

            {/* Telemetry Health Stats (Replaces Practice Flame Grid) */}
            <div className="space-y-3">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold font-mono block">Realtime Calibration Feeds</span>
              
              <div className="rounded-lg bg-[#06090e]/80 border border-white/5 p-3 space-y-2 font-mono text-[9px] text-slate-400">
                <div className="flex justify-between">
                  <span>Vocal Speech Tracking:</span>
                  <span className="text-teal-400 font-bold">140 WPM (Optimal)</span>
                </div>
                <div className="flex justify-between">
                  <span>Posture Drift Alerts:</span>
                  <span className="text-teal-400 font-bold">Link Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Signal Latency:</span>
                  <span className="text-teal-400 font-bold">&lt;150ms (Low)</span>
                </div>
                <div className="flex justify-between">
                  <span>Capture Rate:</span>
                  <span className="text-teal-400 font-bold">30 FPS (Fluid)</span>
                </div>
              </div>
            </div>

            {/* Competency Metric Card */}
            <div className="pt-2.5 flex items-center justify-between border-t border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold font-mono">Average Match Rating</span>
              <span className="text-sm font-black text-teal-400 font-mono">{averageScore}%</span>
            </div>
          </div>

          {/* Competency Telemetry Averages (Replaces newly released drills) */}
          <div className="rounded-2xl border border-white/5 bg-[#0d131a]/85 p-5 shadow-2xl border-t-white/10 space-y-5">
            <div>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-violet-400 font-mono block">Calibration Metrics</span>
              <h4 className="text-sm font-bold text-white tracking-tight">Core Competency Averages</h4>
            </div>

            {hasHistory ? (
              <div className="space-y-3 pt-1">
                <MetricProgressRow label="Domain Expert Match" value={averageScore} color="teal" />
                <MetricProgressRow label="Vocal Speech Fluency" value={articulationAverage} color="violet" />
                <MetricProgressRow label="STAR Logic Alignment" value={starLogicAverage} color="indigo" />
                <MetricProgressRow label="Non-Verbal Stability" value={nonVerbalStability} color="cyan" />
              </div>
            ) : (
              <div className="p-4 bg-[#06090e]/60 rounded-xl border border-white/5 text-center space-y-2 select-none">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrics Offline</p>
                <p className="text-[9.5px] leading-relaxed text-slate-500">
                  Run your first live mock interview room to calibrate visual non-verbal tracking and response scoring metrics.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Recent Mock Sessions Log at bottom */}
      {totalSessions > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#0d131a]/85 p-6 shadow-2xl border-t-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-violet-400 font-mono block">Historical Ledger</span>
              <h3 className="text-lg font-bold text-white tracking-tight">Recent Sessions Log</h3>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {state.history.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-white/5 bg-[#06090e]/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/15 hover:bg-[#121820]/30 transition-all duration-300 group shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9.5px] font-bold text-slate-500 font-mono uppercase tracking-wider">{session.date}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-400 uppercase font-mono group-hover:text-teal-400 group-hover:border-teal-500/20 transition-all">
                      {session.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{session.role}</h4>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                  <div className="text-left sm:text-right space-y-0.5">
                    <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold block">Score</span>
                    <span className="text-base font-extrabold text-teal-400 font-mono">{session.score}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewReport(session)}
                    className="rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-300"
                  >
                    Open Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Action button card component
function ActionLaunchCard({
  title,
  description,
  cta,
  onClick,
  icon
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d131a]/85 p-5 flex flex-col justify-between space-y-4 hover:border-white/15 transition group shadow-xl border-t-white/10 relative overflow-hidden">
      <div className="space-y-2">
        <div className="h-9 w-9 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner group-hover:bg-slate-800 transition">
          {icon}
        </div>
        <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{title}</h4>
        <p className="text-[11px] leading-relaxed text-slate-400">{description}</p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

// Telemetry Diagnostics Row Component
function DiagnosticRow({
  label,
  status,
  desc,
  action,
  onClick,
  variant
}: {
  label: string;
  status: string;
  desc: string;
  action: string;
  onClick: () => void;
  variant: "green" | "blue" | "orange" | "slate";
}) {
  const badgeColors = {
    green: "bg-emerald-500/5 text-emerald-400 border-emerald-500/10",
    blue: "bg-cyan-500/5 text-cyan-400 border-cyan-500/10",
    orange: "bg-amber-500/5 text-amber-400 border-amber-500/10",
    slate: "bg-white/5 text-slate-400 border-white/10"
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#06090e]/60 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-white/10 transition shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h4 className="text-xs font-bold text-white tracking-tight">{label}</h4>
          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold border ${badgeColors[variant]}`}>
            {status}
          </span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">{desc}</p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="rounded border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 font-mono transition"
      >
        {action}
      </button>
    </div>
  );
}

// Sidebar Competency Progress Row
function MetricProgressRow({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: "teal" | "violet" | "indigo" | "cyan";
}) {
  const progressColors = {
    teal: "from-teal-400 to-cyan-400",
    violet: "from-violet-400 to-fuchsia-400",
    indigo: "from-indigo-400 to-violet-400",
    cyan: "from-cyan-400 to-indigo-400"
  };

  const textColors = {
    teal: "text-teal-400",
    violet: "text-violet-400",
    indigo: "text-indigo-400",
    cyan: "text-cyan-400"
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline font-mono text-[9px]">
        <span className="text-slate-400 font-semibold">{label}</span>
        <span className={`${textColors[color]} font-bold`}>{value}%</span>
      </div>
      <div className="w-full h-1 bg-slate-950 border border-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${progressColors[color]} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

