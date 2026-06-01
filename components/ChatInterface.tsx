"use client";

import { useEffect, useRef } from "react";
import { questionTypeLabel } from "@/lib/interview-utils";
import { useInterview } from "@/context/InterviewContext";
import type { ChatMessage, InterviewQuestion } from "@/lib/types";

type ChatInterfaceProps = {
  messages: ChatMessage[];
  currentQuestion?: InterviewQuestion | null;
};

export function ChatInterface({ messages, currentQuestion }: ChatInterfaceProps) {
  const { state } = useInterview();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const totalQuestions = state.questions.length || 5;

  return (
    <section className="flex flex-col min-h-[420px] rounded-xl border border-white/5 bg-[#121820]/80 backdrop-blur-md shadow-2xl">
      {/* Header with Timeline Progress */}
      <div className="border-b border-white/5 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-teal-400">Live Interview Session</p>
            <h2 className="mt-1 text-xl font-bold text-white tracking-tight">
              {currentQuestion ? questionTypeLabel(currentQuestion.type) : "Awaiting job description"}
            </h2>
          </div>
          {state.stage !== "idle" && state.stage !== "finished" && (
            <div className="flex items-center gap-2 border border-teal-500/15 bg-teal-500/5 px-2.5 py-1 rounded-md text-xs font-semibold text-teal-400 tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              {state.stage.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Dynamic Question Timeline */}
        {state.stage !== "idle" && state.stage !== "finished" && state.questions.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between max-w-lg">
              {state.questions.map((q, i) => {
                const isCompleted = i < state.currentQuestionIndex;
                const isActive = i === state.currentQuestionIndex;
                const isUpcoming = i > state.currentQuestionIndex;
                
                // Check if a follow-up was asked for this question
                const isFollowUpActive = currentQuestion?.id === `${q.id}-follow-up` && isActive;

                return (
                  <div key={q.id} className="flex-1 flex items-center">
                    {/* Step Icon */}
                    <div className="flex flex-col items-center relative">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isCompleted
                            ? "bg-teal-400 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(45,212,191,0.2)]"
                            : isActive
                            ? "border-2 border-teal-400 bg-slate-900 text-teal-400 font-extrabold shadow-[0_0_15px_rgba(45,212,191,0.3)] animate-pulse-glow"
                            : "border border-white/10 bg-white/5 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : i + 1}
                      </div>

                      {/* Sub label for current question type */}
                      <span className="hidden md:inline absolute top-9 text-[9px] uppercase tracking-wider text-slate-500 font-medium whitespace-nowrap">
                        {q.type.split("_")[0]}
                      </span>

                      {/* Follow-up Indicator Bubble */}
                      {isActive && isFollowUpActive && (
                        <span className="absolute -top-4 bg-teal-500/10 border border-teal-400/20 text-teal-400 text-[8px] font-bold px-1 py-0.5 rounded tracking-widest uppercase">
                          Probe
                        </span>
                      )}
                    </div>

                    {/* Step Connector Line */}
                    {i < totalQuestions - 1 && (
                      <div
                        className={`flex-1 h-[2px] mx-2 rounded transition-all duration-500 ${
                          i < state.currentQuestionIndex ? "bg-teal-400" : "bg-white/5"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 max-h-[360px]">
        {messages.slice(-4).map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isCandidate = message.role === "candidate";
  const isSystem = message.role === "system";

  return (
    <div className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-5 py-3.5 text-sm leading-relaxed shadow-lg transition-all duration-300 ${
          isCandidate
            ? "border border-teal-500/20 bg-teal-500/5 text-slate-100 shadow-[inset_0_1px_0_rgba(45,212,191,0.05)]"
            : isSystem
            ? "border border-white/5 bg-white/[0.02] text-slate-400 text-xs italic"
            : "border border-white/5 bg-slate-900/60 text-slate-200"
        }`}
      >
        {!isCandidate && !isSystem && (
          <p className="text-[9px] uppercase tracking-widest text-teal-400 font-bold mb-1.5">Interviewer</p>
        )}
        {isCandidate && (
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 text-right">You</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
