"use client";

import { useInterview, type AppView } from "@/context/InterviewContext";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { state, dispatch } = useInterview();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicView = ["landing", "auth"].includes(state.currentView);
  const { user } = useUser();
  const loggedIn = state.auth.loggedIn || !!user?.id;
  const clerkEmail = user?.primaryEmailAddress?.emailAddress || "";
  const displayName = state.profile.name || user?.fullName || user?.firstName || clerkEmail.split("@")[0] || "Candidate";
  const displayEmail = state.auth.email || clerkEmail || "Not signed in";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const targetProfile = state.profile.targetRole || "Not selected";

  function navigateTo(view: AppView) {
    dispatch({ type: "SET_VIEW", payload: view });
    setMobileMenuOpen(false);
  }

  // If public or landing (not logged in) view, show page with simple top navigation
  if (isPublicView && !loggedIn) {
    return (
      <div className="min-h-screen bg-[#090d12] text-slate-100 flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="border-b border-white/5 bg-[#090d12]/80 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("landing")}>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-[0_0_20px_rgba(124,58,237,0.25)]">
                H
              </div>
              <span className="text-xl font-bold tracking-tight text-white">HireFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-slate-400 font-semibold">
              <span className="hover:text-white cursor-pointer transition" onClick={() => navigateTo("landing")}>Platform</span>
              <span className="hover:text-white cursor-pointer transition" onClick={() => navigateTo("landing")}>Features</span>
              <span className="hover:text-white cursor-pointer transition" onClick={() => navigateTo("landing")}>Solutions</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo("auth")}
                className="rounded-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateTo("auth");
                }}
                className="rounded-md bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white px-4 py-2 text-xs font-semibold uppercase tracking-widest transition shadow-[0_0_20px_rgba(124,58,237,0.2)]"
              >
                Start Practicing
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    );
  }

  // Logged-in application shell (Dashboard, Setup, Rooms, etc.)
  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100 flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d131a] border-r border-white/5 p-5 justify-between">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("dashboard")}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-md shadow-[0_0_12px_rgba(124,58,237,0.2)]">
              H
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HireFlow</span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5">
            <SidebarItem
              label="Dashboard"
              view="dashboard"
              active={state.currentView === "dashboard"}
              onClick={() => navigateTo("dashboard")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
              }
            />
            <SidebarItem
              label="Start Interview"
              view="setup"
              active={state.currentView === "setup" || state.currentView === "room"}
              onClick={() => navigateTo("setup")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <SidebarItem
              label="Evaluation Hub"
              view="evaluation_hub"
              active={state.currentView === "evaluation_hub"}
              onClick={() => navigateTo("evaluation_hub")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <SidebarItem
              label="Past Reports"
              view="history"
              active={state.currentView === "history" || state.currentView === "report"}
              onClick={() => navigateTo("history")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <SidebarItem
              label="Profile & Settings"
              view="settings"
              active={state.currentView === "settings"}
              onClick={() => navigateTo("settings")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </nav>
        </div>

        {/* User Card bottom */}
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>
          <SignOutButton>
            <button
              type="button"
              onClick={() => dispatch({ type: "LOGOUT" })}
              className="w-full rounded border border-white/5 bg-slate-900/60 hover:bg-slate-800 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
            >
              Log Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main Workspace content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar navigation for App (Desktop & Mobile) */}
        <header className="border-b border-white/5 bg-[#090d12]/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          {/* Brand/Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md border border-white/10 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="hidden lg:inline text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
              Target Profile: <span className="text-teal-400">{targetProfile}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex rounded-md border border-white/5 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400 tracking-wide font-mono items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Signed in with Clerk
            </div>

            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#090d12]/95 backdrop-blur-md flex flex-col justify-between p-6">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-md">
                    H
                  </div>
                  <span className="text-lg font-bold text-white">HireFlow</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md border border-white/10 text-slate-400 hover:text-white"
                >
                  x
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                <MobileNavItem label="Dashboard" view="dashboard" active={state.currentView === "dashboard"} onClick={() => navigateTo("dashboard")} />
                <MobileNavItem label="Start Interview" view="setup" active={state.currentView === "setup" || state.currentView === "room"} onClick={() => navigateTo("setup")} />
                <MobileNavItem label="Evaluation Hub" view="evaluation_hub" active={state.currentView === "evaluation_hub"} onClick={() => navigateTo("evaluation_hub")} />
                <MobileNavItem label="Past Reports" view="history" active={state.currentView === "history" || state.currentView === "report"} onClick={() => navigateTo("history")} />
                <MobileNavItem label="Profile & Settings" view="settings" active={state.currentView === "settings"} onClick={() => navigateTo("settings")} />
              </nav>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{displayName}</p>
                  <p className="text-[10px] text-slate-500">{displayEmail}</p>
                </div>
              </div>
              <SignOutButton>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "LOGOUT" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded border border-white/5 bg-slate-900/60 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Log Out
                </button>
              </SignOutButton>
            </div>
          </div>
        )}

        {/* Dynamic page render slot */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">{children}</div>
      </div>
    </div>
  );
}

type SidebarItemProps = {
  label: string;
  view: AppView;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
};

function SidebarItem({ label, active, onClick, icon }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-3 transition-all ${
        active
          ? "bg-gradient-to-r from-violet-500/10 to-indigo-600/10 border border-violet-500/25 text-violet-400 shadow-[inset_0_1px_0_rgba(124,58,237,0.05)]"
          : "border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
      }`}
    >
      <span className={active ? "text-violet-400" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function MobileNavItem({ label, active, onClick, view }: { label: string; active: boolean; onClick: () => void; view?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest text-center transition ${
        active
          ? "bg-gradient-to-r from-violet-500/10 to-indigo-600/10 border border-violet-500/20 text-violet-400"
          : "border border-white/5 bg-slate-950/40 text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}



