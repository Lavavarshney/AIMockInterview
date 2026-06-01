import { NextResponse } from "next/server";
import { generateGeminiText, getAIClient, getAIProvider, getQuestionModel } from "@/lib/ai";
import type { AnswerRecord, InterviewQuestion } from "@/lib/types";

export const runtime = "nodejs";

type FollowUpRequest = {
  jobDescription: string;
  resume?: string;
  question: InterviewQuestion;
  answer: string;
  transcript: AnswerRecord[];
};

type FollowUpResponse = {
  shouldAsk: boolean;
  question?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FollowUpRequest;
    if (!body.question?.question || !body.answer) {
      return NextResponse.json({ shouldAsk: false } satisfies FollowUpResponse);
    }

    const localFollowUp = buildLocalFollowUp(body);
    if (localFollowUp.shouldAsk) {
      return NextResponse.json(localFollowUp);
    }

    if (getAIProvider() === "none") {
      return NextResponse.json({ shouldAsk: false } satisfies FollowUpResponse);
    }

    const system =
      "You are an adaptive mock interviewer. Decide whether the candidate's latest answer needs one concise follow-up before moving on. Ask only if the answer is vague, lacks metrics, lacks a concrete example, avoids the question, or misses an important role/resume-specific point. Limit to one follow-up. Return JSON only: {\"shouldAsk\": boolean, \"question\": string}.";
    const payload = `Job description:\n${body.jobDescription}\n\nResume:\n${body.resume || "Not provided"}\n\nCurrent question:\n${body.question.question}\n\nCandidate answer:\n${body.answer}\n\nTranscript so far:\n${body.transcript
      .map((item, index) => `${index + 1}. Q: ${item.question}\nA: ${item.answer}`)
      .join("\n\n")}`;

    if (getAIProvider() === "gemini") {
      const text = await generateGeminiText({
        model: getQuestionModel(),
        system,
        parts: [{ text: payload }],
        json: true
      });

      return NextResponse.json(normalizeFollowUp(JSON.parse(text) as FollowUpResponse));
    }

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: getQuestionModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: payload }
      ]
    });

    return NextResponse.json(normalizeFollowUp(JSON.parse(completion.choices[0]?.message.content || "{}") as FollowUpResponse));
  } catch {
    return NextResponse.json({ shouldAsk: false } satisfies FollowUpResponse);
  }
}

function normalizeFollowUp(response: FollowUpResponse): FollowUpResponse {
  if (!response.shouldAsk || !response.question?.trim()) return { shouldAsk: false };
  return {
    shouldAsk: true,
    question: response.question.trim()
  };
}

function buildLocalFollowUp(body: FollowUpRequest): FollowUpResponse {
  const answer = body.answer.trim();
  const vague = answer.length < 90 || /i don't know|maybe|not sure|kind of|sort of|skip/i.test(answer.toLowerCase());
  const keywords = extractAnswerKeywords(answer);

  if (!vague && keywords.length > 0 && !/\b(metric|users|latency|revenue|time|percent|impact|result|reduced|improved|increased)\b/i.test(answer)) {
    return {
      shouldAsk: true,
      question: `You mentioned ${keywords.slice(0, 2).join(" and ")}. What measurable result, scale, or production impact came from that?`
    };
  }

  if (!vague) return { shouldAsk: false };

  return {
    shouldAsk: true,
    question: keywords.length
      ? `Can you make the ${keywords[0]} part more concrete with your exact contribution and one result?`
      : "Can you make that more concrete with one example, your exact contribution, and a measurable result?"
  };
}

function extractAnswerKeywords(answer: string) {
  const stopWords = new Set([
    "about",
    "after",
    "also",
    "because",
    "before",
    "could",
    "doing",
    "from",
    "have",
    "interview",
    "like",
    "that",
    "there",
    "they",
    "this",
    "with",
    "work",
    "would"
  ]);

  return Array.from(new Set(answer.toLowerCase().match(/\b[a-z][a-z0-9.+#-]{3,}\b/g) || []))
    .filter((word) => !stopWords.has(word))
    .slice(0, 4);
}
