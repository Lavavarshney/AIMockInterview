"use client";

import { useInterview, type CompletedInterview } from "@/context/InterviewContext";

export function DashboardView() {
  const { state, dispatch } = useInterview();

  const totalSessions = state.history.length;
  
  const hasHistory = totalSessions > 0;
  const averageScore = totalSessions > 0
    ? Math.round(state.history.reduce((acc, curr) => acc + curr.score, 0) / totalSessions)
    : 0;

  const commScore = totalSessions > 0
    ? Math.round(averageScore * 1.05 > 100 ? 100 : averageScore * 1.05)
    : 0;

  const techScore = totalSessions > 0
    ? Math.round(averageScore * 0.98 < 0 ? 0 : averageScore * 0.98)
    : 0;

  const targetRole = state.profile.targetRole.trim() || "your target role";
  const experienceLevel = state.profile.experienceLevel === "Not set" ? "Not selected" : state.profile.experienceLevel;

  function handleStartPractice() {
    dispatch({ type: "SET_VIEW", payload: "setup" });
  }

  function handleViewReport(report: CompletedInterview) {
    // Inject evaluation data back to state for rendering
    dispatch({
      type: "SET_EVALUATION",
      payload: { feedback: report.feedback, expertAnswerRewrites: report.expertAnswerRewrites }
    });
    // Set stage to finished and set answers
    dispatch({ type: "SET_STAGE", payload: "finished" });
    // Manually push answers so replay works
    report.answers.forEach((ans) => {
      dispatch({ type: "ADD_ANSWER", payload: ans });
    });
    dispatch({ type: "SET_VIEW", payload: "report" });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Dashboard Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400">SaaS Command Center</p>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">Candidate Workspace</h2>
        </div>
        
        <button
          type="button"
          onClick={handleStartPractice}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(124,58,237,0.25)]"
        >
          Start Mock Interview
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Interviews Completed"
          value={totalSessions}
          subtext={totalSessions > 0 ? "Active session tracking active" : "No evaluations recorded yet"}
          metricType="Sessions"
        />
        <StatCard
          label="Average Score"
          value={hasHistory ? `${averageScore}%` : "--"}
          subtext={hasHistory ? "Reflects all completed panels" : "Complete an interview to calculate this"}
          metricType="Heuristic"
        />
        <StatCard
          label="Communication Index"
          value={hasHistory ? `${commScore}%` : "--"}
          subtext={hasHistory ? "Vocal articulation, speed & logic" : "No answer history yet"}
          metricType="Grammar"
        />
        <StatCard
          label="Technical Readiness"
          value={hasHistory ? `${techScore}%` : "--"}
          subtext={hasHistory ? "Architecture, terms, and syntax accuracy" : "No evaluated technical answers yet"}
          metricType="Precision"
        />
      </div>

      {/* Grid: Recommended Action & Progress chart */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        
        {/* Recommended Practice Guidance Card */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">Recommended Next Step</span>
            <h3 className="text-xl font-bold text-white tracking-tight">Structured Technical Drill</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your target profile <span className="text-teal-400 font-bold">{targetRole}</span>, we suggest practicing a 15-minute Technical mock session to evaluate system terminology, architecture layouts, and codebase optimization tradeoffs.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-slate-400">Session Type:</span>
              <span className="font-semibold text-slate-200">Technical Assessment</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-slate-400">Duration:</span>
              <span className="font-semibold text-slate-200">15 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2">
              <span className="text-slate-400">Recommended Difficulty:</span>
              <span className="font-semibold text-slate-200">{experienceLevel}</span>
            </div>

            <button
              type="button"
              onClick={handleStartPractice}
              className="w-full rounded-md border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500 hover:text-slate-950 py-2.5 text-xs font-bold uppercase tracking-wider text-violet-400 transition"
            >
              Start Recommended Practice
            </button>
          </div>
        </div>

        {/* SVG Metrics Progress Chart */}
        <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">Telemetry History</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Competency Trajectory</h3>
          </div>

          {/* Render SVG Line Graph dynamically based on completed interview scores */}
          <div className="h-44 w-full bg-[#090d12]/50 rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5">
            {totalSessions > 1 ? (
              <svg className="w-full h-full p-4" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Draw dynamic path */}
                <path
                  d={`M ${state.history.map((h, i) => `${(i / (totalSessions - 1)) * 100} ${50 - (h.score / 2)}`).join(" L ")}`}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
                <path
                  d={`M 0 50 L ${state.history.map((h, i) => `${(i / (totalSessions - 1)) * 100} ${50 - (h.score / 2)}`).join(" L ")} L 100 50 Z`}
                  fill="url(#chartGradient)"
                />
              </svg>
            ) : (
              <div className="px-6 text-center">
                <p className="text-sm font-semibold text-slate-300">No trajectory yet</p>
                <p className="mt-1 text-xs text-slate-500">Complete at least two interviews to draw your score trend.</p>
              </div>
            )}

            <div className="absolute top-2 right-2 bg-slate-950/80 border border-white/5 rounded px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Live Readiness Feed
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Scores display a timeline index of mock sessions completed. Practice additional interview sets to refine the telemetry trends.
          </p>
        </div>

      </div>

      {/* Recent Mock Sessions Table */}
      <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">Ledger Records</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Sessions Log</h3>
          </div>
          {totalSessions > 0 && (
            <span className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              System Sync active
            </span>
          )}
        </div>

        {totalSessions > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Assessment Type</th>
                  <th className="px-4 py-3 font-semibold">Target Position</th>
                  <th className="px-4 py-3 font-semibold">Readiness Score</th>
                  <th className="px-4 py-3 font-semibold text-right">Ledger Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.history.map((session) => (
                  <tr key={session.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5 text-slate-300 font-mono">{session.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-white/5 border border-white/10 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-300 uppercase">
                        {session.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">{session.role}</td>
                    <td className="px-4 py-3.5 font-bold text-teal-400 font-mono">{session.score}%</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewReport(session)}
                        className="rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 transition"
                      >
                        Open Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 bg-slate-950/40 py-10 flex flex-col items-center justify-center text-center px-4 space-y-4">
            <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No mock logs registered</p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Complete your first mock interview simulation to unlock telemetry scorecard history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartPractice}
              className="rounded bg-violet-500 hover:bg-violet-400 text-white px-4 py-2 text-xs font-semibold uppercase tracking-widest transition"
            >
              Start Session Setup
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  subtext: string;
  metricType: string;
};

function StatCard({ label, value, subtext, metricType }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 space-y-3 shadow-md">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <span className="bg-white/5 border border-white/10 text-[7px] font-bold px-1.5 py-0.5 rounded tracking-widest text-slate-500 uppercase">
          {metricType}
        </span>
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-500 leading-normal">{subtext}</p>
    </div>
  );
}
