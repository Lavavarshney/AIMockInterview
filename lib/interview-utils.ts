import type { InterviewQuestion, QuestionType } from "@/lib/types";

const codingWords = [
  "code",
  "coding",
  "algorithm",
  "debug",
  "implementation",
  "function",
  "component",
  "query",
  "sql",
  "api",
  "architecture",
  "diagram"
];

export function isCodingQuestion(question: Pick<InterviewQuestion, "question" | "type" | "codingPrompt">) {
  if (question.codingPrompt) return true;
  const text = question.question.toLowerCase();
  return question.type === "technical" && codingWords.some((word) => text.includes(word));
}

export function questionTypeLabel(type: QuestionType) {
  if (type === "system_design") return "System design";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
