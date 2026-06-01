"use client";

import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ScreenCapture } from "@/components/ScreenCapture";
import { VoiceIndicator } from "@/components/VoiceIndicator";

type InterviewRoomViewProps = {
  chat: any[];
  currentQuestion: any;
  progress: number;
  totalQuestions: number;
  stage: string;
  nonVerbal: any;
  recognition: any;
  speech: any;
  capture: any;
  requiresScreenshot: boolean;
  activeScreenshot: string;
  manualAnswer: string;
  setManualAnswer: (val: string) => void;
  voiceNeedsReview: boolean;
  setVoiceNeedsReview: (val: boolean) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onEnd: () => void;
  handleVoiceAnswer: () => void;
  handleScreenStart: () => Promise<void>;
  handleScreenshotCapture: () => Promise<void>;
};

export function InterviewRoomView({
  chat,
  currentQuestion,
  progress,
  totalQuestions,
  stage,
  nonVerbal,
  recognition,
  speech,
  capture,
  requiresScreenshot,
  activeScreenshot,
  manualAnswer,
  setManualAnswer,
  voiceNeedsReview,
  setVoiceNeedsReview,
  onSubmit,
  onSkip,
  onEnd,
  handleVoiceAnswer,
  handleScreenStart,
  handleScreenshotCapture
}: InterviewRoomViewProps) {
  const [seconds, setSeconds] = useState(0);
  const [showPreviews, setShowPreviews] = useState(false);

  // Live session timer counting up to simulate professional interview tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // When a question requiring screenshot mounts, we can prompt or auto-highlight it
  const hasCapturedScreenshot = Boolean(capture.previewUrl || activeScreenshot);

  function formatTime(sec: number) {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  }

  // Ensure local video element binds to webcam if tracking is active
  useEffect(() => {
    if (nonVerbal.isTracking && nonVerbal.videoRef.current) {
      // Re-establish playback of stream
      const stream = nonVerbal.videoRef.current.srcObject as MediaStream | null;
      if (stream) {
        nonVerbal.videoRef.current.play().catch(() => {});
      }
    }
  }, [nonVerbal.isTracking, showPreviews]);

  return (
    <div className="space-y-4 animate-fade-in text-slate-100 max-w-7xl mx-auto">
      {/* Dynamic Session Subheader Topbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet-400">Mock Session Room</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Question {progress || 1}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Timer badge */}
          <div className="rounded-md border border-white/5 bg-[#121820]/80 px-3 py-1.5 text-xs text-slate-300 font-mono font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
            Duration: {formatTime(seconds)}
          </div>
          
          <button
            type="button"
            onClick={onEnd}
            className="rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400 transition"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Two Column focused room grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {/* Left: Chat stream panel */}
        <div className="space-y-4">
          <ChatInterface messages={chat} currentQuestion={currentQuestion} />
        </div>

        {/* Right Pane: Collapsible Telemetry status & Formulate response inputs */}
        <aside className="space-y-5">
          {/* Collapsible Telemetry Status Panel */}
          <section className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Telemetry Status Panel
              </span>
              
              <button
                type="button"
                onClick={() => setShowPreviews(!showPreviews)}
                className="text-[10px] uppercase tracking-widest text-violet-400 hover:text-violet-300 font-bold"
              >
                {showPreviews ? "[Hide Preview Feeds]" : "[Show Preview Feeds]"}
              </button>
            </div>

            {/* Micro Operational Status Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#090d12]/60 border border-white/5 px-2.5 py-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Audio Active
              </span>

              <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#090d12]/60 border border-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                nonVerbal.isTracking ? "text-emerald-400" : "text-slate-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${nonVerbal.isTracking ? "bg-emerald-400" : "bg-slate-700"}`} />
                Camera {nonVerbal.isTracking ? "Active" : "Offline"}
              </span>

              <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#090d12]/60 border border-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                capture.stream ? "text-emerald-400" : "text-slate-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${capture.stream ? "bg-emerald-400" : "bg-slate-700"}`} />
                Screen {capture.stream ? "Linked" : "Offline"}
              </span>

              {requiresScreenshot && !hasCapturedScreenshot && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider animate-pulse">
                  ⚠️ Capture Required
                </span>
              )}
            </div>

            {/* Previews drawer shown on demand */}
            {showPreviews && (
              <div className="space-y-4 pt-3 border-t border-white/5 animate-fade-in">
                {/* Local Webcam Telemetry Feed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-slate-500 font-bold">
                    <span>Webcam Telemetry</span>
                    {nonVerbal.isTracking && (
                      <span className="text-emerald-400">Eye-Contact tracking active</span>
                    )}
                  </div>
                  
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
                    {nonVerbal.isTracking ? (
                      <video
                        ref={nonVerbal.videoRef}
                        muted
                        playsInline
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <span className="text-[10px] text-slate-500">Camera preview is offline. Activate it below if needed.</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (nonVerbal.isTracking) {
                        nonVerbal.stop();
                      } else {
                        void nonVerbal.start();
                      }
                    }}
                    className={`w-full rounded-md py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${
                      nonVerbal.isTracking
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
                        : "border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-slate-950"
                    }`}
                  >
                    {nonVerbal.isTracking ? "Disable Local Camera" : "Enable Local Camera"}
                  </button>
                </div>

                {/* Local Screen Share Workspace */}
                {requiresScreenshot && (
                  <div className="space-y-1.5">
                    <ScreenCapture
                      videoRef={capture.videoRef}
                      stream={capture.stream}
                      previewUrl={capture.previewUrl || activeScreenshot}
                      livePreviewUrl={capture.livePreviewUrl}
                      streamStatus={capture.streamStatus}
                      hasStream={Boolean(capture.stream)}
                      isSupported={capture.isSupported}
                      onStart={handleScreenStart}
                      onCapture={handleScreenshotCapture}
                      onStop={capture.stopSharing}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Voice wave monitor (Clean compact view) */}
          <VoiceIndicator
            isListening={recognition.isListening}
            isSpeaking={speech.isSpeaking}
            transcript={recognition.interimTranscript || manualAnswer}
            recognitionSupported={recognition.isSupported}
            synthesisSupported={speech.isSupported}
            permissionState={recognition.permissionState}
            onStop={recognition.stopListening}
          />

          {/* Active Response formulation console */}
          {currentQuestion && (
            <section className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Formulate Response
                </span>
                
                <button
                  type="button"
                  onClick={handleVoiceAnswer}
                  disabled={recognition.isListening || stage === "asking" || stage === "evaluating"}
                  className="rounded border border-violet-500/40 hover:bg-violet-500 hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {recognition.isListening ? "Listening..." : "Vocal Input"}
                </button>
              </div>

              <textarea
                value={manualAnswer}
                onChange={(event) => {
                  setManualAnswer(event.target.value);
                  setVoiceNeedsReview(false);
                }}
                className="h-32 w-full resize-none rounded-lg border border-white/5 bg-[#090d12]/85 p-4 text-xs leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/50 font-mono"
                placeholder="Type your answer, or review transcribed speech text here before final submission..."
              />

              {voiceNeedsReview && (
                <div className="rounded-md border border-amber-500/15 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-300">
                  Transcriptions can misinterpret shorthand or terminology. Review or edit prior to committing.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-1/3 rounded-lg border border-white/5 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 transition"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={() => onSubmit()}
                  disabled={stage === "asking" || stage === "evaluating"}
                  className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white py-3 text-xs font-bold uppercase tracking-widest transition disabled:opacity-45 shadow-md"
                >
                  {progress === totalQuestions ? "Submit Assessment" : "Commit Answer"}
                </button>
              </div>
            </section>
          )}

        </aside>
      </div>
    </div>
  );
}
