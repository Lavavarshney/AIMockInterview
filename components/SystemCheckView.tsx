"use client";

import { useEffect, useState } from "react";
import { NonVerbalTracker } from "@/components/NonVerbalTracker";

type CheckState = "idle" | "checking" | "passed" | "failed";

type SystemCheckViewProps = {
  recognition: any;
  nonVerbal: any;
  capture: any;
  onStartInterview: () => void;
  onBack: () => void;
  onScreenStart: () => Promise<void>;
  onScreenshotCapture: () => Promise<void>;
};

export function SystemCheckView({
  recognition,
  nonVerbal,
  capture,
  onStartInterview,
  onBack,
  onScreenStart,
  onScreenshotCapture
}: SystemCheckViewProps) {
  const [voiceState, setVoiceState] = useState<CheckState>("idle");
  const [cameraState, setCameraState] = useState<CheckState>("idle");
  const [screenState, setScreenState] = useState<CheckState>("idle");
  const [heardText, setHeardText] = useState("");
  const [micLevel, setMicLevel] = useState(0);

  const allPassed = voiceState === "passed" && cameraState === "passed" && screenState === "passed";

  async function checkVoice() {
    setVoiceState("checking");
    setHeardText("");
    try {
      let micPermissionOk = false;
      if (navigator.mediaDevices?.getUserMedia) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micPermissionOk = await measureMicActivity(micStream, setMicLevel);
        micStream.getTracks().forEach((track) => track.stop());
      }
      setHeardText(micPermissionOk ? "Microphone input detected." : "Microphone permission granted, but no voice level was detected.");
      setVoiceState(micPermissionOk ? "passed" : "failed");
    } catch {
      setVoiceState("failed");
    }
  }

  async function checkCamera() {
    setCameraState("checking");
    try {
      await nonVerbal.start();
      setCameraState("passed");
    } catch {
      setCameraState("failed");
    }
  }

  async function checkScreen() {
    setScreenState("checking");
    try {
      const stream = await capture.startSharing();
      attachScreenPreview(stream);
      setScreenState("passed");
    } catch {
      setScreenState("failed");
    }
  }

  function attachScreenPreview(stream: MediaStream | null) {
    const video = capture.videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => undefined);
  }

  useEffect(() => {
    attachScreenPreview(capture.stream);
  }, [capture.stream]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-white/5 bg-[#121820]/85 p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-violet-400">System Check</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Prepare your interview room</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Complete voice, camera, and screen checks before the first question starts.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/5"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CheckCard
          title="Voice"
          state={voiceState}
          body="Say: I am ready to start interview practice."
          action={recognition.isListening ? "Listening..." : "Test voice"}
          disabled={recognition.isListening}
          onClick={checkVoice}
          micLevel={micLevel}
        />
        <CheckCard
          title="Camera"
          state={cameraState}
          body="Allow camera access so non-verbal tracking can run during answers."
          action={nonVerbal.isTracking ? "Camera active" : "Test camera"}
          disabled={nonVerbal.isTracking}
          onClick={checkCamera}
        />
        <CheckCard
          title="Screen"
          state={screenState}
          body="Share a tab or window once so coding screenshots can be captured later."
          action={capture.stream ? "Sharing active" : "Test screen share"}
          disabled={!capture.isSupported || Boolean(capture.stream)}
          onClick={checkScreen}
        />
      </div>

      {heardText && (
        <div className="rounded-xl border border-white/5 bg-slate-950/50 p-4 text-sm text-slate-300">
          <span className="text-slate-500">Heard:</span> {heardText}
        </div>
      )}

      {recognition.isListening && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-violet-200">
          Listening now. Speak the ready phrase, then pause for two seconds.
          {recognition.interimTranscript && (
            <p className="mt-2 text-slate-200">Live transcript: {recognition.interimTranscript}</p>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <NonVerbalTracker
          videoRef={nonVerbal.videoRef}
          isSupported={nonVerbal.isSupported}
          isDetectorSupported={nonVerbal.isDetectorSupported}
          detectorLabel={nonVerbal.detectorLabel}
          isTracking={nonVerbal.isTracking}
          permissionError={nonVerbal.permissionError}
          metrics={nonVerbal.metrics}
          onStart={nonVerbal.start}
          onStop={nonVerbal.stop}
        />

        <section className="rounded-xl border border-teal-500/15 bg-teal-500/[0.02] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Workspace Share</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                {capture.stream ? "Sharing active. Your selected screen should be visible below." : "Share a browser tab, window, or full desktop."}
              </p>
            </div>
            <div className="flex gap-2">
              {!capture.stream ? (
                <button
                  type="button"
                  onClick={checkScreen}
                  disabled={!capture.isSupported || screenState === "checking"}
                  className="rounded-md bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {screenState === "checking" ? "Opening..." : "Share Screen"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    capture.stopSharing();
                    setScreenState("idle");
                  }}
                  className="rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition hover:bg-rose-500 hover:text-white"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">
            <video ref={capture.videoRef} muted playsInline autoPlay className="h-full w-full object-contain" />
            {capture.livePreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capture.livePreviewUrl}
                alt="Live shared screen frame"
                className="absolute inset-0 h-full w-full object-contain"
              />
            )}
            {!capture.stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-xs text-slate-500">No screen is being shared yet</span>
              </div>
            )}
            {capture.stream && (
              <div className="absolute top-2 left-2 bg-slate-950/80 border border-teal-500/30 text-teal-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
                {capture.streamStatus || "Sharing Live"}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onStartInterview}
          disabled={!allPassed}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Questions
        </button>
      </div>
    </div>
  );
}

function CheckCard({
  title,
  state,
  body,
  action,
  disabled,
  onClick,
  micLevel = 0
}: {
  title: string;
  state: CheckState;
  body: string;
  action: string;
  disabled?: boolean;
  onClick: () => void;
  micLevel?: number;
}) {
  const status = state === "passed" ? "Passed" : state === "failed" ? "Retry needed" : state === "checking" ? "Checking" : "Not checked";

  return (
    <section className="rounded-xl border border-white/5 bg-[#121820]/80 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            state === "passed"
              ? "bg-teal-500/10 text-teal-300"
              : state === "failed"
              ? "bg-rose-500/10 text-rose-300"
              : "bg-white/5 text-slate-400"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-xs leading-relaxed text-slate-400">{body}</p>
      {title === "Voice" && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${Math.min(100, micLevel)}%` }} />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || state === "checking"}
        className="mt-4 w-full rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-violet-300 transition hover:bg-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {action}
      </button>
    </section>
  );
}

async function measureMicActivity(stream: MediaStream, onLevel: (level: number) => void) {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return true;

  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let peak = 0;
  const started = performance.now();

  while (performance.now() - started < 1800) {
    analyser.getByteFrequencyData(data);
    const average = data.reduce((sum, value) => sum + value, 0) / data.length;
    peak = Math.max(peak, average);
    onLevel(Math.min(100, Math.round(average * 2)));
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }

  await context.close();
  onLevel(Math.min(100, Math.round(peak * 2)));
  return peak > 1;
}
