import { NextResponse } from "next/server";
import {
  dataUrlToGeminiPart,
  generateGeminiText,
  getAIClient,
  getAIProvider,
  getEvaluationModel
} from "@/lib/ai";
import type { EvaluationRequest, ExpertAnswerRewrite } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EvaluationRequest & { resume?: string };
    if (!body.jobDescription || !body.transcript?.length) {
      return NextResponse.json({ error: "Job description and transcript are required." }, { status: 400 });
    }

    const provider = getAIProvider();

    if (provider === "none") {
      const expertAnswerRewrites = buildLocalRewrites(body.transcript);
      return NextResponse.json({
        feedback: [
          "## HireFlow Feedback",
          "",
          "No AI provider is configured, so this is a local placeholder report.",
          "",
          "### Transcript captured",
          body.transcript.map((item, index) => `${index + 1}. **${item.question}**\n\n${item.answer}`).join("\n\n"),
          "",
          "### Next step",
          "Add `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY` to `.env.local` to enable AI evaluation."
        ].join("\n"),
        expertAnswerRewrites
      });
    }

    const transcriptText = body.transcript
      .map(
        (item, index) =>
          `Question ${index + 1} (${item.type}): ${item.question}\nCandidate answer: ${item.answer}\nScreenshot attached: ${Boolean(item.screenshot)}`
      )
      .join("\n\n");

    const screenshots = body.transcript.filter((item) => item.screenshot);

    const system =
      "You are a senior hiring interviewer. Evaluate the candidate using the job description, resume, transcript, non-verbal metrics, and any screenshots. Return a structured Markdown report with: Overall recommendation, Scorecard, Strengths, Concerns, Question-by-question feedback, Resume-specific probing quality, Non-verbal feedback, Screenshot observations, and Concrete next practice plan.";
    const nonVerbalText = body.nonVerbalMetrics
      ? `\n\nNon-verbal metrics:\nEye contact: ${body.nonVerbalMetrics.eyeContactPercent}%\nLooking away: ${body.nonVerbalMetrics.lookingAwayPercent}%\nFace visible: ${body.nonVerbalMetrics.faceVisiblePercent}%\nExpression positivity proxy: ${body.nonVerbalMetrics.expressionPositivity}%\nSamples: ${body.nonVerbalMetrics.samples}`
      : "\n\nNon-verbal metrics: Not captured.";

    if (provider === "gemini") {
      try {
        const imageParts = screenshots
          .map((item) => (item.screenshot ? dataUrlToGeminiPart(item.screenshot) : null))
          .filter((part): part is NonNullable<typeof part> => Boolean(part));

        const feedback = await generateGeminiText({
          model: getEvaluationModel(),
          system,
          parts: [
            {
              text: `Job description:\n${body.jobDescription}${body.resume ? `\n\nResume:\n${body.resume}` : ""}\n\nInterview transcript:\n${transcriptText}${nonVerbalText}\n\nScreenshot count: ${imageParts.length}. If images are present, inspect them and include screenshot observations.`
            },
            ...imageParts
          ]
        });

        const expertAnswerRewrites = await buildExpertAnswerRewrites(body, transcriptText);
        return NextResponse.json({ feedback, expertAnswerRewrites });
      } catch {
        return NextResponse.json({ feedback: buildLocalEvaluation(body.jobDescription, transcriptText) });
      }
    }

    const ai = getAIClient();
    const imageParts =
      provider === "openai" || provider === "openrouter"
        ? screenshots.map((item) => ({
            type: "image_url" as const,
            image_url: {
              url: item.screenshot as string,
              detail: "high" as const
            }
          }))
        : [];

    const screenshotNote =
      provider === "groq" && screenshots.length
        ? `\n\nScreenshot note: ${screenshots.length} screenshot(s) were captured during coding/system-design answers, but the configured Groq text model cannot inspect image pixels in this implementation. Evaluate the answers using the transcript and mention this limitation clearly.`
        : "";

    try {
      const completion = await ai.chat.completions.create({
        model: getEvaluationModel(),
        messages: [
          {
            role: "system",
            content: system
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Job description:\n${body.jobDescription}${body.resume ? `\n\nResume:\n${body.resume}` : ""}\n\nInterview transcript:\n${transcriptText}${nonVerbalText}${screenshotNote}`
              },
              ...imageParts
            ]
          }
        ]
      });

      const expertAnswerRewrites = await buildExpertAnswerRewrites(body, transcriptText);
      return NextResponse.json({
        feedback: completion.choices[0]?.message.content || "No feedback returned.",
        expertAnswerRewrites
      });
    } catch {
      return NextResponse.json({ feedback: buildLocalEvaluation(body.jobDescription, transcriptText) });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to evaluate interview." },
      { status: 500 }
    );
  }
}

function buildLocalEvaluation(jobDescription: string, transcriptText: string) {
  return [
    "## HireFlow Feedback",
    "",
    "AI provider request failed, so this is a local fallback report.",
    "",
    "### Scorecard",
    "| Skill Area | Rating (1-5, 5 being best) | Justification |",
    "| --- | --- | --- |",
    "| Communication | 3 | Answers were captured, but the provider was unavailable so the final rubric is fallback-only. |",
    "| Technical depth | 3 | The transcript was available, but the model could not be reached for a full evaluation. |",
    "| Role fit | 3 | Use the transcript and resume-aware questions to rerun the session once the provider is configured. |",
    "",
    "### Transcript captured",
    transcriptText,
    "",
    "### Next step",
    `Retry with a configured provider. Job description length: ${jobDescription.length} characters.`
  ].join("\n");
}

async function buildExpertAnswerRewrites(body: EvaluationRequest, transcriptText: string): Promise<ExpertAnswerRewrite[]> {
  const fallback = buildLocalRewrites(body.transcript);

  try {
    if (getAIProvider() === "none") return fallback;

    const system =
      "For each interview answer, write a stronger senior-candidate version tailored to the job description and resume. Preserve the candidate's likely experience, but add clearer structure, missing tradeoffs, metrics, and stronger language. Return JSON only: {\"rewrites\":[{\"questionId\":\"...\",\"question\":\"...\",\"originalAnswer\":\"...\",\"expertAnswer\":\"...\",\"missingSignals\":[\"...\"]}]}";
    const payload = `Job description:\n${body.jobDescription}\n\nResume:\n${body.resume || "Not provided"}\n\nTranscript:\n${transcriptText}`;

    if (getAIProvider() === "gemini") {
      const text = await generateGeminiText({
        model: getEvaluationModel(),
        system,
        parts: [{ text: payload }],
        json: true
      });
      return normalizeRewrites(JSON.parse(text) as { rewrites?: ExpertAnswerRewrite[] }, fallback);
    }

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: getEvaluationModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: payload }
      ]
    });

    return normalizeRewrites(JSON.parse(completion.choices[0]?.message.content || "{}") as { rewrites?: ExpertAnswerRewrite[] }, fallback);
  } catch {
    return fallback;
  }
}

function normalizeRewrites(
  parsed: { rewrites?: ExpertAnswerRewrite[] },
  fallback: ExpertAnswerRewrite[]
): ExpertAnswerRewrite[] {
  const rewrites = parsed.rewrites || [];
  if (!rewrites.length) return fallback;

  return rewrites.map((rewrite, index) => ({
    questionId: rewrite.questionId || fallback[index]?.questionId || `answer-${index + 1}`,
    question: rewrite.question || fallback[index]?.question || "",
    originalAnswer: rewrite.originalAnswer || fallback[index]?.originalAnswer || "",
    expertAnswer: rewrite.expertAnswer || fallback[index]?.expertAnswer || "",
    missingSignals: Array.isArray(rewrite.missingSignals) ? rewrite.missingSignals : []
  }));
}

function buildLocalRewrites(transcript: EvaluationRequest["transcript"]): ExpertAnswerRewrite[] {
  return transcript.map((item) => ({
    questionId: item.questionId,
    question: item.question,
    originalAnswer: item.answer,
    expertAnswer: `A stronger version would use STAR structure: briefly set context, name your exact action, explain one tradeoff, and close with a measurable result tied to ${item.type.replace("_", " ")} expectations.`,
    missingSignals: ["Specific metric", "Clear ownership", "Tradeoff or outcome"]
  }));
}
