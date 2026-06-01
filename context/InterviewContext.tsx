"use client";

import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer
} from "react";
import { createId } from "@/lib/interview-utils";
import type {
  AnswerRecord,
  ChatMessage,
  CompletedInterview,
  ExpertAnswerRewrite,
  InterviewQuestion,
  InterviewStage,
  ToastMessage
} from "@/lib/types";

export type AppView =
  | "landing"
  | "auth"
  | "dashboard"
  | "setup"
  | "checks"
  | "room"
  | "evaluation_hub"
  | "report"
  | "history"
  | "settings";

export type AuthState = {
  loggedIn: boolean;
  email: string;
};

export type ProfileState = {
  name: string;
  targetRole: string;
  experienceLevel: string;
  preferredType: string;
};

type InterviewState = {
  stage: InterviewStage;
  jobDescription: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  expertAnswerRewrites: ExpertAnswerRewrite[];
  chat: ChatMessage[];
  feedback: string;
  toasts: ToastMessage[];
  // SaaS Extended State
  currentView: AppView;
  auth: AuthState;
  profile: ProfileState;
  history: CompletedInterview[];
};

type InterviewAction =
  | { type: "SET_JOB_DESCRIPTION"; payload: string }
  | { type: "SET_STAGE"; payload: InterviewStage }
  | { type: "SET_QUESTIONS"; payload: InterviewQuestion[] }
  | { type: "ADD_CHAT"; payload: Omit<ChatMessage, "id" | "createdAt"> }
  | { type: "ADD_ANSWER"; payload: AnswerRecord }
  | { type: "SET_FEEDBACK"; payload: string }
  | { type: "SET_EVALUATION"; payload: { feedback: string; expertAnswerRewrites?: ExpertAnswerRewrite[] } }
  | { type: "LOAD_REPORT"; payload: { feedback: string; answers: AnswerRecord[]; expertAnswerRewrites?: ExpertAnswerRewrite[] } }
  | { type: "NEXT_QUESTION" }
  | { type: "ADD_TOAST"; payload: Omit<ToastMessage, "id"> }
  | { type: "DISMISS_TOAST"; payload: string }
  | { type: "RESET" }
  // SaaS Actions
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "LOGIN"; payload: { email: string; name?: string } }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; payload: Partial<ProfileState> }
  | { type: "ADD_HISTORY"; payload: CompletedInterview }
  | { type: "SET_HISTORY"; payload: CompletedInterview[] };

const initialState: InterviewState = {
  stage: "idle",
  jobDescription: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  expertAnswerRewrites: [],
  chat: [
    {
      id: "welcome",
      role: "system",
      content: "Paste a job description to begin a focused mock interview.",
      createdAt: Date.now()
    }
  ],
  feedback: "",
  toasts: [],
  // Extended state defaults
  currentView: "landing",
  auth: {
    loggedIn: false,
    email: ""
  },
  profile: {
    name: "",
    targetRole: "",
    experienceLevel: "Not set",
    preferredType: "Technical"
  },
  history: []
};

function reducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case "SET_JOB_DESCRIPTION":
      return { ...state, jobDescription: action.payload };
    case "SET_STAGE":
      return { ...state, stage: action.payload };
    case "SET_QUESTIONS":
      return {
        ...state,
        questions: action.payload,
        currentQuestionIndex: 0,
        answers: [],
        expertAnswerRewrites: [],
        feedback: ""
      };
    case "ADD_CHAT":
      return {
        ...state,
        chat: [
          ...state.chat,
          {
            ...action.payload,
            id: createId("message"),
            createdAt: Date.now()
          }
        ]
      };
    case "ADD_ANSWER":
      return { ...state, answers: [...state.answers, action.payload] };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.payload, stage: "finished" };
    case "SET_EVALUATION":
      return {
        ...state,
        feedback: action.payload.feedback,
        expertAnswerRewrites: action.payload.expertAnswerRewrites || [],
        stage: "finished"
      };
    case "LOAD_REPORT":
      return {
        ...state,
        feedback: action.payload.feedback,
        answers: action.payload.answers,
        expertAnswerRewrites: action.payload.expertAnswerRewrites || [],
        stage: "finished"
      };
    case "NEXT_QUESTION":
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: createId("toast") }]
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload)
      };
    case "RESET":
      return {
        ...state,
        stage: "idle",
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        expertAnswerRewrites: [],
        feedback: "",
        chat: initialState.chat.map((item) => ({ ...item, createdAt: Date.now() }))
      };
    // SaaS Reduction rules
    case "SET_VIEW":
      return { ...state, currentView: action.payload };
    case "LOGIN":
      return {
        ...state,
        auth: { loggedIn: true, email: action.payload.email },
        profile: { ...state.profile, name: action.payload.name || state.profile.name },
        currentView: "dashboard"
      };
    case "LOGOUT":
      return {
        ...state,
        auth: { loggedIn: false, email: "" },
        currentView: "landing",
        stage: "idle",
        history: []
      };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "ADD_HISTORY":
      return { ...state, history: [action.payload, ...state.history] };
    case "SET_HISTORY":
      return { ...state, history: action.payload };
    default:
      return state;
  }
}

type InterviewContextValue = {
  state: InterviewState;
  dispatch: Dispatch<InterviewAction>;
};

const InterviewContext = createContext<InterviewContextValue | null>(null);

export function InterviewProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within InterviewProvider");
  }

  return context;
}
