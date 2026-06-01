"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
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
import type { AnswerRecord, EvaluationResponse, InterviewQuestion } from "@/lib/types";

function calculateSessionScore(transcript: AnswerRecord[]) {
  if (!transcript.length) return 0;

  const total = transcript.reduce((sum, item) => {
    const answer = item.answer.trim();
    const lowerAnswer = answer.toLowerCase();
    let score = 45;

    if (answer.length > 40) score += 10;
    if (answer.length > 120) score += 15;
    if (/\b(example|metric|measured|impact|tradeoff|because|latency|scale|users|reliability|observability)\b/i.test(answer)) {
      score += 15;
    }
    if (item.screenshot) score += 5;
    if (/\b(skip|don't know|dont know|not sure|no idea)\b/.test(lowerAnswer)) score -= 20;

    return sum + Math.max(0, Math.min(100, score));
  }, 0);

  return Math.round(total / transcript.length);
}

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

  const currentQuestion = activeQuestion || state.questions[state.currentQuestionIndex];
  const progress = state.questions.length ? state.currentQuestionIndex + 1 : 0;
  const requiresScreenshot = currentQuestion ? isCodingQuestion(currentQuestion) : false;

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (isLoaded && email && !state.auth.loggedIn) {
      dispatch({
        type: "LOGIN",
        payload: {
          email,
          name: user.fullName || user.firstName || email.split("@")[0]
        }
      });
    }
  }, [dispatch, isLoaded, state.auth.loggedIn, user]);

  async function postJson<TResponse>(url: string, body: unknown, retries = 1): Promise<TResponse> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      return data as TResponse;
    } catch (error) {
      if (retries > 0) return postJson<TResponse>(url, body, retries - 1);
      throw error;
    }
  }

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
    capture.stopSharing();

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

    await evaluate(fullTranscript);
  }

  async function handleSkip() {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questions.length) {
      dispatch({ type: "NEXT_QUESTION" });
      await askQuestion(state.questions[nextIndex]);
    } else {
      await evaluate(state.answers);
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

      const newScore = calculateSessionScore(transcript);
      const newSession = {
        id: `session-${Date.now()}`,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        role: state.profile.targetRole || "Untitled role",
        type: state.profile.preferredType,
        score: newScore,
        feedback: data.feedback,
        answers: transcript,
        expertAnswerRewrites: data.expertAnswerRewrites || []
      };
      dispatch({ type: "ADD_HISTORY", payload: newSession });
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
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        role: state.profile.targetRole || "Untitled role",
        type: state.profile.preferredType,
        score: calculateSessionScore(transcript),
        feedback: rawFeedback,
        answers: transcript,
        expertAnswerRewrites: []
      };
      dispatch({ type: "ADD_HISTORY", payload: newSession });
      dispatch({ type: "SET_VIEW", payload: "report" });
    }
  }

  const currentView = state.currentView;

  return (
    <>
      <ToastStack />

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
              onEnd={() => evaluate(state.answers)}
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

