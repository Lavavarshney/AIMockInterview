import type { AnswerRecord, QuestionType } from "@/lib/types";

export type AnswerScore = {
  answer: AnswerRecord;
  score: number;
  wordCount: number;
  isSkipped: boolean;
  strengths: string[];
  gaps: string[];
  missingSignals: string[];
};

export type PerformanceSummary = {
  overall: number;
  domain: number;
  articulation: number;
  communication: number;
  answeredCount: number;
  skippedCount: number;
  averageWords: number;
  answerScores: AnswerScore[];
};

const SKIPPED_PATTERN = /\b(\[?skipped\]?|skip|pass|don't know|dont know|do not know|not sure|no idea|idk)\b/i;
const FILLER_PATTERN = /\b(kind of|sort of|maybe|i think|like|basically|actually)\b/gi;
const IMPACT_PATTERN = /\b(metric|users?|latency|revenue|time|percent|impact|result|reduced|improved|increased|decreased|saved|conversion|retention|uptime|error rate)\b/i;
const STRUCTURE_PATTERN = /\b(for example|for instance|specifically|because|therefore|tradeoff|challenge|action|result|outcome|learned)\b/i;
const TECH_PATTERN = /\b(api|database|cache|latency|scale|queue|schema|test|deploy|component|state|auth|endpoint|observability|reliability|consistency)\b/i;
const BEHAVIOR_PATTERN = /\b(team|stakeholder|feedback|conflict|ownership|collaborat|influenc|mentor|priorit|decision)\b/i;
const SYSTEM_PATTERN = /\b(scale|reliab|monitor|queue|shard|replica|consistency|throughput|load balanc|partition|api|data model|observability)\b/i;

export function scoreAnswer(answer: AnswerRecord): AnswerScore {
  const text = answer.answer.trim();
  const normalized = text.toLowerCase();
  const words = text.match(/\b[\w'-]+\b/g) || [];
  const wordCount = words.length;
  const isSkipped = wordCount === 0 || SKIPPED_PATTERN.test(normalized);

  if (isSkipped) {
    return {
      answer,
      score: 0,
      wordCount,
      isSkipped: true,
      strengths: ["No assessable answer was provided."],
      gaps: ["This question was skipped or answered with uncertainty, so it receives no performance credit."],
      missingSignals: missingSignalsForType(answer.type)
    };
  }

  let score = 0;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const missingSignals = new Set<string>();

  if (wordCount >= 18) {
    score += 18;
    strengths.push("Answered with enough substance to evaluate.");
  } else {
    score += 8;
    gaps.push("The answer is too short to prove competence.");
  }

  if (wordCount >= 55) score += 14;
  else gaps.push("Add more concrete detail, not just a directionally correct statement.");

  if (wordCount >= 110) score += 10;

  if (STRUCTURE_PATTERN.test(text)) {
    score += 14;
    strengths.push("Shows some structure or reasoning.");
  } else {
    missingSignals.add("Clear structure");
    gaps.push("Structure the answer around context, action, tradeoff, and result.");
  }

  if (IMPACT_PATTERN.test(text)) {
    score += 16;
    strengths.push("Mentions impact or measurable outcomes.");
  } else {
    missingSignals.add("Specific metric");
    gaps.push("Include a measurable result or concrete business/technical impact.");
  }

  const typeScore = typeSpecificScore(answer.type, text);
  score += typeScore.points;
  typeScore.strengths.forEach((item) => strengths.push(item));
  typeScore.missing.forEach((item) => missingSignals.add(item));
  typeScore.gaps.forEach((item) => gaps.push(item));

  const fillerMatches = normalized.match(FILLER_PATTERN) || [];
  if (fillerMatches.length >= 5) {
    score -= 8;
    gaps.push("Reduce filler language and answer with more certainty.");
  }

  if (/\bwrong|failed|couldn't|could not|unable\b/i.test(text) && !/\b(learned|fixed|improved|changed|afterward|result)\b/i.test(text)) {
    score -= 8;
    gaps.push("When discussing a problem, close with what changed afterward.");
  }

  if (answer.screenshot && (answer.type === "technical" || answer.type === "system_design")) {
    score += 4;
    strengths.push("Includes a visual artifact for a technical/system-design answer.");
  }

  if (wordCount < 25) {
    score = Math.min(score, 35);
  } else if (wordCount < 55 && !IMPACT_PATTERN.test(text)) {
    score = Math.min(score, 50);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    answer,
    score: finalScore,
    wordCount,
    isSkipped: false,
    strengths: strengths.length ? strengths : ["The answer was captured and partially relevant."],
    gaps: gaps.length ? gaps : ["Add sharper metrics, tradeoffs, and role-specific terminology to move higher."],
    missingSignals: Array.from(missingSignals).length ? Array.from(missingSignals) : missingSignalsForType(answer.type)
  };
}

export function scoreInterview(answers: AnswerRecord[], plannedQuestionCount = answers.length): PerformanceSummary {
  const answerScores = answers.map(scoreAnswer);
  const missingCount = Math.max(0, plannedQuestionCount - answers.filter((item) => !String(item.questionId).includes("-follow-up")).length);
  const zeroScores = Array.from({ length: missingCount }, () => 0);
  const allScores = [...answerScores.map((item) => item.score), ...zeroScores];
  const overall = allScores.length
    ? Math.round(allScores.reduce((total, score) => total + score, 0) / allScores.length)
    : 0;

  const answered = answerScores.filter((item) => !item.isSkipped);
  const averageWords = answered.length
    ? Math.round(answered.reduce((total, item) => total + item.wordCount, 0) / answered.length)
    : 0;

  const domainScores = answerScores.filter((item) => item.answer.type === "technical" || item.answer.type === "system_design");
  const behaviorScores = answerScores.filter((item) => item.answer.type === "behavioral");

  return {
    overall,
    domain: averageScore(domainScores, overall),
    articulation: Math.max(0, Math.min(100, Math.round(overall + (averageWords >= 70 ? 6 : averageWords >= 35 ? 0 : -10)))),
    communication: averageScore(behaviorScores, overall),
    answeredCount: answered.length,
    skippedCount: answerScores.filter((item) => item.isSkipped).length + missingCount,
    averageWords,
    answerScores
  };
}

export function performanceLabel(score: number) {
  if (score < 20) return "Incomplete Response";
  if (score < 40) return "Entry-Level";
  if (score < 60) return "Developing";
  if (score < 75) return "Professional";
  if (score < 90) return "Advanced Professional";
  return "Expert";
}

function averageScore(scores: AnswerScore[], fallback: number) {
  if (!scores.length) return fallback;
  return Math.round(scores.reduce((total, item) => total + item.score, 0) / scores.length);
}

function typeSpecificScore(type: QuestionType, text: string) {
  if (type === "technical") {
    return TECH_PATTERN.test(text)
      ? { points: 18, strengths: ["Uses relevant technical terminology."], gaps: [] as string[], missing: [] as string[] }
      : { points: 2, strengths: [] as string[], gaps: ["Use concrete implementation details and technical terminology."], missing: ["Implementation detail", "Technical terminology"] };
  }

  if (type === "system_design") {
    return SYSTEM_PATTERN.test(text)
      ? { points: 18, strengths: ["Touches system-design concerns."], gaps: [] as string[], missing: [] as string[] }
      : { points: 2, strengths: [] as string[], gaps: ["Cover APIs, data model, reliability, scaling, and observability."], missing: ["APIs", "Data model", "Reliability", "Observability"] };
  }

  return BEHAVIOR_PATTERN.test(text)
    ? { points: 18, strengths: ["Mentions team, ownership, or collaboration context."], gaps: [] as string[], missing: [] as string[] }
    : { points: 2, strengths: [] as string[], gaps: ["Use a concrete behavioral example with ownership and outcome."], missing: ["STAR example", "Ownership", "Outcome"] };
}

function missingSignalsForType(type: QuestionType) {
  if (type === "technical") return ["Implementation detail", "Technical terminology", "Specific metric"];
  if (type === "system_design") return ["APIs", "Data model", "Reliability", "Observability"];
  return ["STAR structure", "Clear ownership", "Measurable outcome"];
}
