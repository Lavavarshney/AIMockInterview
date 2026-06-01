"use client";

import { useInterview } from "@/context/InterviewContext";
import type { CompletedInterview } from "@/lib/types";
import { useState } from "react";

export function HistoryView() {
  const { state, dispatch } = useInterview();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Technical" | "HR / Behavioral" | "DSA" | "System Design">("all");

  const totalSessions = state.history.length;

  const filteredSessions = state.history.filter((session) => {
    const matchesSearch = session.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || session.type === filterType;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400">Ledger Ledger</p>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">Past Assessment Reports</h2>
          <p className="text-xs text-slate-400 mt-1">Audit and replay historical mock simulation scorecards.</p>
        </div>
      </div>

      {totalSessions > 0 ? (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by target role..."
              className="rounded-lg border border-white/5 bg-[#121820]/80 p-2.5 text-xs text-slate-100 outline-none transition focus:border-violet-500/50 w-full max-w-xs font-mono"
            />
            
            <div className="rounded-md border border-white/5 bg-slate-900/60 p-0.5 flex">
              {(["all", "Technical", "HR / Behavioral", "DSA", "System Design"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                    filterType === t
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "all" ? "All Rounds" : t.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 shadow-xl">
            {filteredSessions.length > 0 ? (
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
                    {filteredSessions.map((session) => (
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
              <div className="text-center py-10 text-xs text-slate-500">
                No session reports match your search criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-8 py-12 text-center space-y-4 shadow-xl flex flex-col items-center max-w-md mx-auto">
          <div className="h-10 w-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-300">No mock logs registered</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Complete your first mock interview simulation to register assessment ledger reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_VIEW", payload: "setup" })}
            className="rounded bg-violet-500 hover:bg-violet-400 text-white px-4 py-2 text-xs font-semibold uppercase tracking-widest transition"
          >
            Start Session Setup
          </button>
        </div>
      )}

    </div>
  );
}
