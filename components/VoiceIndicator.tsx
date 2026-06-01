"use client";

type VoiceIndicatorProps = {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  permissionState: PermissionState | "unknown";
  onStop?: () => void;
};

export function VoiceIndicator({
  isListening,
  isSpeaking,
  transcript,
  recognitionSupported,
  synthesisSupported,
  permissionState,
  onStop
}: VoiceIndicatorProps) {
  const permissionDenied = permissionState === "denied";

  return (
    <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-4">
        {/* Animated Audio Telemetry Pulse */}
        <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-slate-900 border border-white/5 flex-shrink-0">
          {(isListening || isSpeaking) && (
            <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${isSpeaking ? "bg-teal-400" : "bg-teal-500"}`} />
          )}
          <div
            className={`h-4.5 w-4.5 rounded-full transition-all duration-300 ${
              isSpeaking
                ? "bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)] animate-pulse"
                : isListening
                ? "bg-teal-500 shadow-[0_0_12px_rgba(45,212,191,0.6)] animate-pulse"
                : "bg-slate-700"
            }`}
          />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-white tracking-wide uppercase">
            {isSpeaking ? "Interviewer Speaking" : isListening ? "Listening Live" : "Audio Standby"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {permissionDenied
              ? "Microphone access blocked"
              : recognitionSupported && synthesisSupported
              ? "Browser Speech API active"
              : "Speech fallbacks operational"}
          </p>
        </div>

        {isListening && onStop && (
          <button
            type="button"
            onClick={onStop}
            className="rounded-md border border-white/10 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 transition"
          >
            Mute
          </button>
        )}
      </div>

      {/* Real-time transcript box */}
      <div className="relative">
        <div className="absolute top-2.5 right-2.5 bg-slate-950/80 border border-white/10 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
          Live Transcription Feed
        </div>
        <div className="min-h-24 rounded-lg border border-white/5 bg-[#090d12]/60 p-4 pt-8 text-xs leading-relaxed text-slate-300 font-mono select-all">
          {transcript || "Real-time speech transcription readout will buffer here when answering..."}
        </div>
      </div>

      {permissionDenied && (
        <div className="rounded-md border border-rose-500/15 bg-rose-500/5 p-4 text-xs leading-relaxed text-rose-300 space-y-1">
          <p className="font-semibold uppercase tracking-wider text-rose-400">Microphone permission blocked</p>
          <p>Please check your browser permissions settings to allow microphone inputs, then reload the page. You can still input manual responses below.</p>
        </div>
      )}
    </section>
  );
}
