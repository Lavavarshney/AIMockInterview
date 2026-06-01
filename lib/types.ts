export type InterviewStage =
  | "idle"
  | "generating"
  | "asking"
  | "listening"
  | "awaiting_screenshot"
  | "evaluating"
  | "finished";

export type QuestionType = "technical" | "behavioral" | "system_design";

export type InterviewQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  codingPrompt?: boolean;
};

export type AnswerRecord = {
  questionId: string;
  question: string;
  type: QuestionType;
  answer: string;
  screenshot?: string;
};

export type NonVerbalMetrics = {
  samples: number;
  eyeContactPercent: number;
  lookingAwayPercent: number;
  faceVisiblePercent: number;
  expressionPositivity: number;
};

export type ExpertAnswerRewrite = {
  questionId: string;
  question: string;
  originalAnswer: string;
  expertAnswer: string;
  missingSignals: string[];
};

export type ChatMessage = {
  id: string;
  role: "system" | "interviewer" | "candidate";
  content: string;
  createdAt: number;
};

export type ToastMessage = {
  id: string;
  type: "error" | "success" | "info";
  message: string;
};

export type EvaluationRequest = {
  jobDescription: string;
  resume?: string;
  transcript: AnswerRecord[];
  nonVerbalMetrics?: NonVerbalMetrics;
};

export type EvaluationResponse = {
  feedback: string;
  expertAnswerRewrites?: ExpertAnswerRewrite[];
};
