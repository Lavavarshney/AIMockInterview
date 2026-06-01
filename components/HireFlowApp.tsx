"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { LandingPage } from "@/components/LandingPage";
import { AuthPage } from "@/components/AuthPage";
import { DashboardView } from "@/components/DashboardView";
import { SetupView } from "@/components/SetupView";
import { SystemCheckView } from "@/components/SystemCheckView";
import { InterviewRoomView } from "@/components/InterviewRoomView";
import { EvaluationHubView } from "@/components/EvaluationHubView";
import { HistoryView } from "@/components/HistoryView";
import { SettingsView } from "@/components/SettingsView";
import { AppShell } from "@/components/AppShell";
import { FeedbackView } from "@/components/FeedbackView";
import { ToastStack } from "@/components/ToastStack";
import { useInterview } from "@/context/InterviewContext";
import { useNonVerbalTracker } from "@/hooks/useNonVerbalTracker";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { isCodingQuestion } from "@/lib/interview-utils";
import { scoreInterview } from "@/lib/scoring";
import type { AnswerRecord, CompletedInterview, EvaluationResponse, InterviewQuestion } from "@/lib/types";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Request timed out.")), timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}

function buildQuickFollowUp(answer: string) {
  const lowerAnswer = answer.toLowerCase();
  if (answer.trim().length < 90) {
    return "Can you expand that with one specific example, your exact contribution, and the outcome?";
  }
  if (!/\b(metric|users|latency|revenue|time|percent|impact|result|reduced|improved|increased)\b/i.test(answer)) {
    return "What measurable result or concrete impact came from that work?";
  }
  if (/\bmaybe|not sure|kind of|sort of|i think\b/.test(lowerAnswer)) {
    return "Can you restate that with more certainty and one concrete detail from the project?";
  }
  return "";
}

export function HireFlowApp() {
  const { state, dispatch } = useInterview();
  const { user, isLoaded } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [parsingResume, setParsingResume] = useState(false);

  const speech = useSpeechSynthesis();
  const recognition = useSpeechRecognition();
  const capture = useScreenCapture();
  const nonVerbal = useNonVerbalTracker();
  
  const [manualAnswer, setManualAnswer] = useState("");
  const [activeScreenshot, setActiveScreenshot] = useState("");
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestion | null>(null);
  const [followUpsAsked, setFollowUpsAsked] = useState<Set<string>>(() => new Set());
  const [voiceNeedsReview, setVoiceNeedsReview] = useState(false);
  const historyLoadedRef = useRef(false);
  const [evaluationSeconds, setEvaluationSeconds] = useState(0);

  useEffect(() => {
    if (state.stage === "evaluating") {
      setEvaluationSeconds(0);
      const timer = setInterval(() => {
        setEvaluationSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setEvaluationSeconds(0);
    }
  }, [state.stage]);

  const currentQuestion = activeQuestion || state.questions[state.currentQuestionIndex];
  const progress = state.questions.length ? state.currentQuestionIndex + 1 : 0;
  const requiresScreenshot = currentQuestion ? isCodingQuestion(currentQuestion) : false;

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (isLoaded && isAuthLoaded && isSignedIn && email && !state.auth.loggedIn) {
      dispatch({
        type: "LOGIN",
        payload: {
          email,
          name: user.fullName || user.firstName || email.split("@")[0]
        }
      });
    }
  }, [dispatch, isAuthLoaded, isLoaded, isSignedIn, state.auth.loggedIn, user]);

  async function buildAuthHeaders() {
    const headers: HeadersInit = {};
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  const loadHistory = useCallback(async () => {
    try {
      console.log("[Frontend] Loading history...");
      if (!isAuthLoaded || !isSignedIn) {
        console.log("[Frontend] Clerk session not ready, skipping history load");
        return;
      }
      const response = await fetch("/api/history", {
        method: "GET",
        headers: await buildAuthHeaders(),
        credentials: "include"
      });
      const data = await response.json();
      console.log("[Frontend] History response status:", response.status, "data:", data);
      if (!response.ok) {
        console.warn("[Frontend] API returned error, falling back to localStorage");
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem("interview_history");
        if (stored) {
          dispatch({ type: "SET_HISTORY", payload: JSON.parse(stored) });
          return;
        }
        throw new Error(data.error || "Unable to load history.");
      }
      console.log("[Frontend] Setting history:", data.sessions?.length || 0, "sessions");
      dispatch({ type: "SET_HISTORY", payload: data.sessions || [] });
    } catch (error) {
      console.error("[Frontend] Load history error:", error);
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", message: error instanceof Error ? error.message : "Unable to load history." }
      });
    }
  }, [dispatch, isAuthLoaded, isSignedIn]);

  useEffect(() => {
    if (!state.auth.loggedIn) {
      historyLoadedRef.current = false;
      return;
    }
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    void loadHistory();
  }, [loadHistory, state.auth.loggedIn]);

  const postJson = useCallback(async <TResponse,>(url: string, body: unknown, retries = 1): Promise<TResponse> => {
    try {
      const authHeaders = await buildAuthHeaders();
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      return data as TResponse;
    } catch (error) {
      if (retries > 0) return postJson<TResponse>(url, body, retries - 1);
      throw error;
    }
  }, [getToken]);

  const persistHistory = useCallback(async (session: CompletedInterview) => {
    if (!state.auth.loggedIn) {
      console.log("[Frontend] Not logged in, skipping persist");
      return;
    }
    try {
      console.log("[Frontend] Persisting session:", session.id);
      await postJson("/api/history", { session }, 0);
      console.log("[Frontend] Session persisted successfully");
    } catch (error) {
      console.error("[Frontend] Persist error, falling back to localStorage:", error);
      // Fallback: also save to localStorage
      const stored = localStorage.getItem("interview_history") || "[]";
      const history = JSON.parse(stored) as CompletedInterview[];
      history.unshift(session);
      localStorage.setItem("interview_history", JSON.stringify(history));
      console.log("[Frontend] Session saved to localStorage as fallback");
      
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "info", message: "Session saved locally (database sync pending)" }
      });
    }
  }, [dispatch, postJson, state.auth.loggedIn]);

  function openSystemChecks() {
    dispatch({ type: "SET_VIEW", payload: "checks" });
  }

  async function startInterview() {
    try {
      dispatch({ type: "SET_STAGE", payload: "generating" });
      dispatch({ type: "ADD_CHAT", payload: { role: "system", content: "Generating tailored questions..." } });
      dispatch({ type: "SET_VIEW", payload: "room" }); // Transition to Room immediately!
      const data = await postJson<{ questions: InterviewQuestion[] }>("/api/generate-questions", {
        jobDescription: state.jobDescription,
        resume: resumeText.trim(),
        profile: state.profile
      });
      dispatch({ type: "SET_QUESTIONS", payload: data.questions });
      await askQuestion(data.questions[0]);
    } catch (error) {
      dispatch({ type: "SET_VIEW", payload: "setup" });
      dispatch({ type: "SET_STAGE", payload: "idle" });
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", message: error instanceof Error ? error.message : "Unable to start interview." }
      });
    }
  }

  async function askQuestion(question: InterviewQuestion) {
    setActiveQuestion(question);
    setManualAnswer("");
    setVoiceNeedsReview(false);
    setActiveScreenshot("");
    recognition.clearTranscript();
    dispatch({ type: "SET_STAGE", payload: "asking" });
    dispatch({ type: "ADD_CHAT", payload: { role: "interviewer", content: question.question } });

    await speech.speak(question.question);

    dispatch({ type: "SET_STAGE", payload: isCodingQuestion(question) ? "awaiting_screenshot" : "listening" });
  }

  async function handleScreenStart() {
    try {
      await capture.startSharing();
      dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Screen sharing started." } });
    } catch (error) {
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "error",
          message: error instanceof Error && error.name === "NotAllowedError" ? "Screen share permission was denied." : "Unable to share screen."
        }
      });
    }
  }

  async function handleScreenshotCapture() {
    try {
      const screenshot = await capture.captureScreenshot();
      setActiveScreenshot(screenshot);
      dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Screenshot captured." } });
    } catch (error) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", message: error instanceof Error ? error.message : "Unable to capture screenshot." }
      });
    }
  }

  async function handleVoiceAnswer() {
    dispatch({ type: "SET_STAGE", payload: "listening" });
    try {
      const answer = await recognition.startListening();
      setManualAnswer(answer);
      if (!answer) {
        dispatch({ type: "ADD_TOAST", payload: { type: "info", message: "No speech detected. You can type your answer." } });
        return;
      }
      setVoiceNeedsReview(true);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "info",
          message: "Voice answer captured. Review/edit it, then press Submit Answer."
        }
      });
    } catch (error) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", message: error instanceof Error ? error.message : "Microphone unavailable." }
      });
    }
  }

  async function submitAnswer(answerOverride?: unknown) {
    if (!currentQuestion) return;
    const overrideText = typeof answerOverride === "string" ? answerOverride.trim() : "";
    const answer = overrideText || manualAnswer.trim() || recognition.interimTranscript.trim();
    if (!answer) {
      dispatch({ type: "ADD_TOAST", payload: { type: "error", message: "Add an answer before continuing." } });
      return;
    }

    const record: AnswerRecord = {
      questionId: String(currentQuestion.id),
      question: currentQuestion.question,
      type: currentQuestion.type,
      answer,
      screenshot: activeScreenshot || undefined
    };

    dispatch({ type: "ADD_ANSWER", payload: record });
    dispatch({ type: "ADD_CHAT", payload: { role: "candidate", content: answer } });
    setManualAnswer("");
    setVoiceNeedsReview(false);
    recognition.clearTranscript();

    const fullTranscript = [...state.answers, record];
    const currentQuestionId = String(currentQuestion.id);
    if (!currentQuestionId.includes("-follow-up") && !followUpsAsked.has(currentQuestionId)) {
      const followUp = await getFollowUp(currentQuestion, answer, fullTranscript);
      setFollowUpsAsked((current) => new Set(current).add(currentQuestionId));

      if (followUp) {
        const followUpQuestion: InterviewQuestion = {
          id: `${currentQuestionId}-follow-up`,
          type: currentQuestion.type,
          question: followUp,
          codingPrompt: false
        };
        await askQuestion(followUpQuestion);
        return;
      }
    }

    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questions.length) {
      dispatch({ type: "NEXT_QUESTION" });
      await askQuestion(state.questions[nextIndex]);
      return;
    }

    await evaluate(completeTranscriptWithSkipped(fullTranscript));
  }

  function buildSkippedRecord(question: InterviewQuestion): AnswerRecord {
    return {
      questionId: String(question.id),
      question: question.question,
      type: question.type,
      answer: "[Skipped]"
    };
  }

  function completeTranscriptWithSkipped(transcript: AnswerRecord[]) {
    const seen = new Set(transcript.map((item) => String(item.questionId)));
    const missing = state.questions
      .filter((question) => !seen.has(String(question.id)))
      .map((question) => buildSkippedRecord(question));
    return [...transcript, ...missing];
  }

  async function handleSkip() {
    if (!currentQuestion) return;
    const skippedRecord = buildSkippedRecord(currentQuestion);
    const fullTranscript = [...state.answers, skippedRecord];
    dispatch({ type: "ADD_ANSWER", payload: skippedRecord });
    dispatch({ type: "ADD_CHAT", payload: { role: "candidate", content: "Skipped question." } });
    setManualAnswer("");
    recognition.clearTranscript();

    if (String(currentQuestion.id).includes("-follow-up")) {
      const nextIndexAfterFollowUp = state.currentQuestionIndex + 1;
      if (nextIndexAfterFollowUp < state.questions.length) {
        dispatch({ type: "NEXT_QUESTION" });
        await askQuestion(state.questions[nextIndexAfterFollowUp]);
      } else {
        await evaluate(completeTranscriptWithSkipped(fullTranscript));
      }
      return;
    }

    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questions.length) {
      dispatch({ type: "NEXT_QUESTION" });
      await askQuestion(state.questions[nextIndex]);
    } else {
      await evaluate(completeTranscriptWithSkipped(fullTranscript));
    }
  }

  async function getFollowUp(question: InterviewQuestion, answer: string, transcript: AnswerRecord[]) {
    try {
      const data = await withTimeout(
        postJson<{ shouldAsk: boolean; question?: string }>("/api/follow-up", {
          jobDescription: state.jobDescription,
          resume: resumeText.trim(),
          question,
          answer,
          transcript
        }, 0),
        2500
      );
      return data.shouldAsk ? data.question || "" : "";
    } catch {
      return buildQuickFollowUp(answer);
    }
  }

  async function evaluate(transcript: AnswerRecord[]) {
    try {
      dispatch({ type: "SET_STAGE", payload: "evaluating" });
      dispatch({ type: "ADD_CHAT", payload: { role: "system", content: "Evaluating the complete interview..." } });
      const data = await postJson<EvaluationResponse>("/api/evaluate", {
        jobDescription: state.jobDescription,
        resume: resumeText.trim(),
        transcript,
        nonVerbalMetrics: nonVerbal.metrics
      });
      nonVerbal.stop();
      dispatch({ type: "SET_EVALUATION", payload: data });

      const performance = scoreInterview(transcript, state.questions.length);
      const newScore = performance.overall;
      const newSession = {
        id: `session-${Date.now()}`,
        date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        role: state.profile.targetRole || "Untitled role",
        type: state.profile.preferredType,
        score: newScore,
        feedback: data.feedback,
        answers: transcript,
        expertAnswerRewrites: data.expertAnswerRewrites || []
      };
      dispatch({ type: "ADD_HISTORY", payload: newSession });
      await persistHistory(newSession);
      dispatch({ type: "SET_VIEW", payload: "report" });
    } catch (error) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", message: error instanceof Error ? error.message : "Evaluation failed." }
      });
      dispatch({ type: "SET_STAGE", payload: "finished" });
      
      const rawFeedback = "## Evaluation unavailable\n\nThe transcript was captured, but the AI evaluation request failed. Please check network keys and retry.";
      dispatch({ type: "SET_FEEDBACK", payload: rawFeedback });

      const newSession = {
        id: `session-${Date.now()}`,
        date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        role: state.profile.targetRole || "Untitled role",
        type: state.profile.preferredType,
        score: scoreInterview(transcript, state.questions.length).overall,
        feedback: rawFeedback,
        answers: transcript,
        expertAnswerRewrites: []
      };
      dispatch({ type: "ADD_HISTORY", payload: newSession });
      await persistHistory(newSession);
      dispatch({ type: "SET_VIEW", payload: "report" });
    }
  }

  const currentView = state.currentView;

  return (
    <>
      <ToastStack />

      {/* Premium full-screen loading analytics loader */}
      {state.stage === "evaluating" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090d12]/95 backdrop-blur-md animate-fade-in select-none">
          <div className="flex flex-col items-center space-y-6 max-w-sm w-full px-6">
            
            {/* Purple circular icon with sparkle SVG */}
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] border border-violet-400/20">
              <svg className="w-10 h-10 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {/* Spinning/pulsing accent ring */}
              <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>

            {/* Subtext captions matching REMASTO style */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Loading your analytics</h3>
              <p className="text-xs text-slate-400 font-medium font-sans">
                Building a strict scorecard from your transcript. Elapsed {evaluationSeconds}s.
              </p>
            </div>

            {/* Indeterminate progress only; no fake percentage or time estimate */}
            <div className="w-full h-1.5 bg-slate-950 border border-white/5 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full w-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(124,58,237,0.5)] animate-pulse"
              />
            </div>

          </div>
        </div>
      )}

      {/* Render Public Landing Page separately without sidebar layout */}
      {currentView === "landing" && (
        <LandingPage
          onStartClick={() => {
            dispatch({ type: "SET_VIEW", payload: state.auth.loggedIn ? "dashboard" : "auth" });
          }}
        />
      )}

      {/* Render Auth View separately */}
      {currentView === "auth" && <AuthPage />}

      {/* Render app workspace using AppShell wrapper sidebar */}
      {!["landing", "auth"].includes(currentView) && (
        <AppShell>
          {currentView === "dashboard" && <DashboardView />}
          
          {currentView === "setup" && (
            <SetupView
              jobDescription={state.jobDescription}
              onJobDescriptionChange={(val) => dispatch({ type: "SET_JOB_DESCRIPTION", payload: val })}
              resumeText={resumeText}
              onResumeTextChange={setResumeText}
              resumeFileName={resumeFileName}
              onResumeFileNameChange={setResumeFileName}
              parsingResume={parsingResume}
              onParsingResumeChange={setParsingResume}
              onStart={openSystemChecks}
              generating={state.stage === "generating"}
            />
          )}

          {currentView === "checks" && (
            <SystemCheckView
              recognition={recognition}
              nonVerbal={nonVerbal}
              capture={capture}
              onBack={() => dispatch({ type: "SET_VIEW", payload: "setup" })}
              onStartInterview={startInterview}
              onScreenStart={handleScreenStart}
              onScreenshotCapture={handleScreenshotCapture}
            />
          )}

          {currentView === "room" && (
            <InterviewRoomView
              chat={state.chat}
              currentQuestion={currentQuestion}
              progress={progress}
              totalQuestions={state.questions.length}
              stage={state.stage}
              nonVerbal={nonVerbal}
              recognition={recognition}
              speech={speech}
              capture={capture}
              requiresScreenshot={requiresScreenshot}
              activeScreenshot={activeScreenshot}
              manualAnswer={manualAnswer}
              setManualAnswer={setManualAnswer}
              voiceNeedsReview={voiceNeedsReview}
              setVoiceNeedsReview={setVoiceNeedsReview}
              onSubmit={submitAnswer}
              onSkip={handleSkip}
              onEnd={() => evaluate(completeTranscriptWithSkipped(state.answers))}
              handleVoiceAnswer={handleVoiceAnswer}
              handleScreenStart={handleScreenStart}
              handleScreenshotCapture={handleScreenshotCapture}
            />
          )}

          {currentView === "evaluation_hub" && <EvaluationHubView />}
          
          {currentView === "report" && (
            <FeedbackView
              feedback={state.feedback}
              answers={state.answers}
              onReset={() => {
                capture.stopSharing();
                nonVerbal.stop();
                speech.cancel();
                dispatch({ type: "RESET" });
                setActiveQuestion(null);
                setFollowUpsAsked(new Set());
                dispatch({ type: "SET_VIEW", payload: "dashboard" });
              }}
              expertAnswerRewrites={state.expertAnswerRewrites}
              nonVerbalMetrics={nonVerbal.metrics}
            />
          )}

          {currentView === "history" && <HistoryView />}

          {currentView === "settings" && <SettingsView />}
        </AppShell>
      )}
    </>
  );
}
