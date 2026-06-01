"use client";

import { useEffect, type RefObject } from "react";

type ScreenCaptureProps = {
  videoRef: RefObject<HTMLVideoElement>;
  stream?: MediaStream | null;
  previewUrl: string;
  livePreviewUrl?: string;
  streamStatus?: string;
  hasStream: boolean;
  isSupported: boolean;
  onStart: () => Promise<void>;
  onCapture: () => Promise<void>;
  onStop: () => void;
};

export function ScreenCapture({
  videoRef,
  stream,
  previewUrl,
  livePreviewUrl,
  streamStatus,
  hasStream,
  isSupported,
  onStart,
  onCapture,
  onStop
}: ScreenCaptureProps) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => undefined);
  }, [stream, videoRef]);

  return (
    <section className="rounded-xl border border-teal-500/15 bg-teal-500/[0.02] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">Workspace Share</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {hasStream
              ? "Sharing active • Capture code or system design"
              : "Share browser tab, window, or full desktop"}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasStream ? (
            <button
              type="button"
              onClick={() => void onStart()}
              disabled={!isSupported}
              className="rounded-md bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Share Screen
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void onCapture()}
                className="rounded-md bg-white text-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-slate-200"
              >
                Capture Frame
              </button>
              <button
                type="button"
                onClick={onStop}
                className="rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-rose-500 hover:text-white"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {!isSupported && (
        <div className="rounded-md border border-rose-500/15 bg-rose-500/5 p-3 text-xs text-rose-300">
          Workspace sharing is not supported in this browser.
        </div>
      )}

      {/* Screen Sharing Feeds (Stack or Split Layout) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Live Stream Panel */}
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Live Stream Feed</span>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-contain transition-opacity duration-300 ${hasStream ? "opacity-100" : "opacity-0"}`}
            />
            {livePreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={livePreviewUrl} alt="Live shared screen frame" className="absolute inset-0 h-full w-full object-contain" />
            )}
            {hasStream && (
              <div className="absolute top-2 left-2 bg-slate-950/80 border border-teal-500/30 text-teal-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                {streamStatus || "Sharing Live"}
              </div>
            )}
            {!hasStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <svg className="w-8 h-8 text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-slate-500">Video source disconnected</span>
              </div>
            )}
          </div>
        </div>

        {/* Captured Screenshot Panel */}
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Evaluation Artifact</span>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Captured coding screenshot" className="h-full w-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <svg className="w-8 h-8 text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-slate-500">No screenshot captured</span>
              </div>
            )}
            {previewUrl && (
              <div className="absolute top-2 left-2 bg-slate-950/80 border border-teal-500/30 text-teal-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1.5">
                Saved Screenshot
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
