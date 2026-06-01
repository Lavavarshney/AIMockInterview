"use client";

import { SignInButton } from "@clerk/nextjs";

export function AuthPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-6 bg-[#090d12]">
      <div className="w-full max-w-[420px] rounded-2xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-8 space-y-6 shadow-2xl animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-[0_0_20px_rgba(124,58,237,0.25)]">
            H
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to HireFlow</h2>
          <p className="text-xs text-slate-400">
            Continue with Clerk. Google login is configured from your Clerk dashboard.
          </p>
        </div>

        <SignInButton mode="modal" forceRedirectUrl="/">
          <button
            type="button"
            className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 py-3 text-xs font-bold uppercase tracking-widest text-white transition shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          >
            Continue with Clerk
          </button>
        </SignInButton>

        <p className="text-[10px] text-slate-500 leading-relaxed text-center">
          Add <span className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> and{" "}
          <span className="font-mono">CLERK_SECRET_KEY</span> to <span className="font-mono">.env.local</span>.
        </p>
      </div>
    </div>
  );
}
