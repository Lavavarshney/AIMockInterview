import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { question } = (await request.json()) as { question?: string };
    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const fallbackText = buildShortSpokenPrompt(question);
    return NextResponse.json({ text: fallbackText });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to phrase the question." },
      { status: 500 }
    );
  }
}

function buildShortSpokenPrompt(question: string) {
  const cleaned = question.replace(/\s+/g, " ").trim();
  const withoutLongIntro = cleaned.replace(/^You mentioned .+?\. Can you/i, "Can you");
  return clampSpokenPrompt(withoutLongIntro, cleaned);
}

function clampSpokenPrompt(text: string, fallback: string) {
  const cleaned = (text || fallback)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "");
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length <= 24) return cleaned;
  return `${words.slice(0, 24).join(" ")}?`;
}
