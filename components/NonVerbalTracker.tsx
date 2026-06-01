"use client";

import type { RefObject } from "react";
import type { NonVerbalMetrics } from "@/lib/types";

type NonVerbalTrackerProps = {
  videoRef: RefObject<HTMLVideoElement>;
  isSupported: boolean;
  isDetectorSupported: boolean;
  detectorLabel: string;
  isTracking: boolean;
  permissionError: string;
  metrics: NonVerbalMetrics;
  onStart: () => Promise<void>;
  onStop: () => void;
};

export function NonVerbalTracker({
  videoRef,
  isSupported,
  isDetectorSupported,
  detectorLabel,
  isTracking,
  permissionError,
  metrics,
  onStart,
  onStop
}: NonVerbalTrackerProps) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Non-Verbal Analytics</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {isTracking
              ? isDetectorSupported
                ? `Active • ${detectorLabel} local telemetry`
                : "Active • Secure camera preview mode"
              : "Inactive • Awaiting activation"}
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => void (isTracking ? Promise.resolve(onStop()) : onStart())}
          disabled={!isSupported}
          className={`rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
            isTracking
              ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
              : "border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.15)]"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isTracking ? "Stop Camera" : "Start Camera"}
        </button>
      </div>

      {/* Webcam View Container */}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full object-cover transition-opacity duration-300 ${isTracking ? "opacity-100" : "opacity-0"}`}
        />

        {/* Video Overlay Scanner / Indicators */}
        {isTracking && (
          <>
            <div className="absolute inset-0 border border-teal-500/20 pointer-events-none" />
            <div className="absolute top-2 left-2 bg-slate-950/80 border border-teal-500/30 text-teal-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              Live Telemetry
            </div>
            {/* Corner styling lines to look like target tracker */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-teal-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-teal-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-teal-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-teal-400" />
          </>
        )}

        {!isTracking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-2">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-slate-400">Webcam stream remains fully local and is never uploaded.</p>
          </div>
        )}
      </div>

      {/* Telemetry Metrics display */}
      <div className="grid gap-2 sm:grid-cols-4">
        <MetricCard
          label="Eye Contact"
          value={isTracking ? metrics.eyeContactPercent : 0}
          active={isTracking}
          theme="teal"
        />
        <MetricCard
          label="Looking Away"
          value={isTracking ? metrics.lookingAwayPercent : 0}
          active={isTracking}
          theme="amber"
        />
        <MetricCard
          label="Face Visible"
          value={isTracking ? metrics.faceVisiblePercent : 0}
          active={isTracking}
          theme="teal"
        />
        <MetricCard
          label="Presence Confidence"
          value={isTracking ? metrics.confidenceScore : 0}
          active={isTracking}
          theme="teal"
        />
      </div>

      {isTracking && metrics.samples >= 10 && metrics.lookingAwayPercent > 55 && (
        <div className="rounded-md border border-amber-500/15 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-300">
          Looking-away ratio is elevated. Center your face and anchor your gaze near the lens.
        </div>
      )}

      {permissionError && (
        <div className="rounded-md border border-rose-500/15 bg-rose-500/5 p-3 text-xs leading-relaxed text-rose-300">
          {permissionError}
        </div>
      )}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
  active: boolean;
  theme: "teal" | "amber";
};

function MetricCard({ label, value, active, theme }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#090d12]/50 p-3 space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</span>
        <span className="text-sm font-bold text-white">{active ? `${value}%` : "--"}</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            active
              ? theme === "teal"
                ? "bg-teal-400"
                : "bg-amber-400"
              : "bg-slate-700"
          }`}
          style={{ width: active ? `${value}%` : "0%" }}
        />
      </div>
    </div>
  );
}
