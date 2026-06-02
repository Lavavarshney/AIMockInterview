"use client";

import { useInterview } from "@/context/InterviewContext";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export function SettingsView() {
  const { state, dispatch } = useInterview();
  const { user } = useUser();

  // Local state initialized from profile context
  const [name, setName] = useState(state.profile.name);
  const [role, setRole] = useState(state.profile.targetRole);
  const [exp, setExp] = useState(state.profile.experienceLevel);
  const [type, setType] = useState(state.profile.preferredType);
  
  const [saveStatus, setSaveStatus] = useState("");

  const displayEmail = user?.primaryEmailAddress?.emailAddress || state.auth.email || "Not signed in";
  
  const clerkProvider = user?.externalAccounts?.[0]?.provider;
  const displayProvider = clerkProvider
    ? `${clerkProvider.charAt(0).toUpperCase() + clerkProvider.slice(1)} Authentication (Clerk)`
    : "Clerk Secure Session";

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
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in text-slate-100">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-teal-400 font-mono block">WORKSPACE CONFIGURATION</span>
        <h2 className="mt-1 text-3xl font-black text-white tracking-tight leading-none">Profile & Settings</h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">
          Calibrate target matching filters, experience benchmarks, and preferred assessment domains.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-white/5 bg-[#0d131a]/85 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Candidate Name */}
          <div className="space-y-2">
            <label htmlFor="settingsName" className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold font-mono block">
              Candidate Name
            </label>
            <input
              id="settingsName"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/80 p-3 text-xs text-slate-100 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/10 font-mono"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-2">
            <label htmlFor="settingsRole" className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold font-mono block">
              Target Role
            </label>
            <input
              id="settingsRole"
              type="text"
              placeholder="e.g. Frontend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/80 p-3 text-xs text-slate-100 outline-none transition focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/10 font-mono"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Experience Level */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold font-mono block">Experience Level</span>
            <select
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/80 p-3 text-xs text-slate-200 outline-none transition focus:border-teal-500/50 font-mono"
            >
              <option value="Not set">Not set</option>
              <option value="Associate / Junior">Associate / Junior (0-2 Yrs)</option>
              <option value="Mid-Senior">Mid-Senior (3-6 Yrs)</option>
              <option value="Principal / Lead">Principal / Lead (7+ Yrs)</option>
            </select>
          </div>

          {/* Preferred Interview Focus */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold font-mono block">Preferred Focus round</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/80 p-3 text-xs text-slate-200 outline-none transition focus:border-teal-500/50 font-mono"
            >
              <option value="HR / Behavioral">HR / Behavioral</option>
              <option value="Technical">Technical MCQ & Screen Capture</option>
              <option value="DSA">DSA / Coding Challenges</option>
              <option value="System Design">System Design & API Tradeoffs</option>
            </select>
          </div>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[9px] uppercase tracking-widest text-slate-500 font-extrabold font-mono">Authentication Metadata</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Locked fields displaying authentic Clerk Session Details */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 opacity-75">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold font-mono block">Log Account Email</span>
            <input
              type="text"
              disabled
              value={displayEmail}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/40 p-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
            />
          </div>
          
          <div className="space-y-2 opacity-75">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-extrabold font-mono block">Authentication Provider</span>
            <input
              type="text"
              disabled
              value={displayProvider}
              className="w-full rounded-lg border border-white/5 bg-[#06090e]/40 p-3 text-xs text-slate-400 outline-none cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-xs font-semibold text-teal-400 font-mono">{saveStatus}</span>
          
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition shadow-md shadow-violet-500/10"
          >
            Save Profile Changes
          </button>
        </div>

      </form>
    </div>
  );
}

