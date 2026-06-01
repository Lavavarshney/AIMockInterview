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

  // Live session timer counting up to simulate professional interview tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(sec: number) {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      
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

        {/* Right Pane: Telemetry widgets & input */}
        <aside className="space-y-5">
          
          {/* Voice wave monitor */}
          <VoiceIndicator
            isListening={recognition.isListening}
            isSpeaking={speech.isSpeaking}
            transcript={recognition.interimTranscript || manualAnswer}
            recognitionSupported={recognition.isSupported}
            synthesisSupported={speech.isSupported}
            permissionState={recognition.permissionState}
            onStop={recognition.stopListening}
          />

          {/* Screen capture console (conditional) */}
          {currentQuestion && requiresScreenshot && (
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
          )}

          {/* Active Response formulation console */}
          {currentQuestion && (
            <section className="rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Formulate Response</span>
                
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
                placeholder="Type response, or review transcribed speech text here before final submission..."
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
                  Skip Question
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
