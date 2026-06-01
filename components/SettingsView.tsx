"use client";

import { useInterview } from "@/context/InterviewContext";
import { useState } from "react";

export function SettingsView() {
  const { state, dispatch } = useInterview();

  // Local state initialized from profile context
  const [name, setName] = useState(state.profile.name);
  const [role, setRole] = useState(state.profile.targetRole);
  const [exp, setExp] = useState(state.profile.experienceLevel);
  const [type, setType] = useState(state.profile.preferredType);
  
  const [saveStatus, setSaveStatus] = useState("");

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("Saving changes...");
    
    dispatch({
      type: "UPDATE_PROFILE",
      payload: { name, targetRole: role, experienceLevel: exp, preferredType: type }
    });
    dispatch({
      type: "ADD_TOAST",
      payload: { type: "success", message: "Candidate profile settings updated." }
    });
    setSaveStatus("All changes saved.");
    setTimeout(() => setSaveStatus(""), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-violet-400">Security Ledger</p>
          <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">Profile & Settings</h2>
          <p className="text-xs text-slate-400 mt-1">Calibrate target matching filters for assessment rooms.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        {/* Left selector */}
        <aside className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          <button
            type="button"
            className="rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left bg-white/5 text-white border-l border-violet-500"
          >
            General Profile
          </button>
          <button
            type="button"
            disabled
            className="rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left text-slate-600 cursor-not-allowed"
          >
            Security Keys
          </button>
          <button
            type="button"
            disabled
            className="rounded px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left text-slate-600 cursor-not-allowed"
          >
            Integrations
          </button>
        </aside>

        {/* Right Settings Form */}
        <form onSubmit={handleSave} className="rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Candidate Name */}
            <div className="space-y-1.5">
              <label htmlFor="settingsName" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Candidate Name
              </label>
              <input
                id="settingsName"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-100 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 font-mono"
              />
            </div>

            {/* Target Role */}
            <div className="space-y-1.5">
              <label htmlFor="settingsRole" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Target Role
              </label>
              <input
                id="settingsRole"
                type="text"
                placeholder="e.g. Frontend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-100 outline-none transition focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 font-mono"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Experience Level */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Experience Level</span>
              <select
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/80 p-3 text-xs text-slate-200 outline-none transition focus:border-violet-500/50"
              >
                <option value="Not set">Not set</option>
                <option value="Associate / Junior">Associate / Junior</option>
                <option value="Mid-Senior">Mid-Senior</option>
                <option value="Principal / Lead">Principal / Lead</option>
              </select>
            </div>

            {/* Preferred Interview Focus */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Preferred Focus round</span>
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-slate-500 font-semibold font-mono">Authentication Metadata</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          {/* Locked fields */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5 opacity-60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Log Account Email</span>
              <input
                type="text"
                disabled
                value={state.auth.email || "Not signed in"}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/40 p-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
              />
            </div>
            
            <div className="space-y-1.5 opacity-60">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Authentication Provider</span>
              <input
                type="text"
                disabled
                value={state.auth.loggedIn ? "Google OAuth via NextAuth" : "No active session"}
                className="w-full rounded-lg border border-white/5 bg-[#090d12]/40 p-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs font-semibold text-teal-400 font-mono">{saveStatus}</span>
            
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-md"
            >
              Save Profile Changes
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
