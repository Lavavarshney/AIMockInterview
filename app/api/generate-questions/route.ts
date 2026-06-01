import { NextResponse } from "next/server";
import { generateGeminiText, getAIClient, getAIProvider, getQuestionModel } from "@/lib/ai";
import type { InterviewQuestion } from "@/lib/types";

export const runtime = "nodejs";

const fallbackQuestions: InterviewQuestion[] = [
  {
    id: "technical-1",
    type: "technical",
    question: "Walk me through a recent technical project that maps to this role. What tradeoffs did you make?",
    codingPrompt: false
  },
  {
    id: "technical-2",
    type: "technical",
    question: "Design and explain a small implementation for the most important technical requirement in this job description.",
    codingPrompt: true
  },
  {
    id: "behavioral-1",
    type: "behavioral",
    question: "Tell me about a time you had to influence a team without direct authority.",
    codingPrompt: false
  },
  {
    id: "behavioral-2",
    type: "behavioral",
    question: "Describe a time you received difficult feedback. What changed afterward?",
    codingPrompt: false
  },
  {
    id: "system-1",
    type: "system_design",
    question: "Design a scalable system for one core workflow in this role. Cover APIs, data model, reliability, and observability.",
    codingPrompt: true
  }
];

export async function POST(request: Request) {
  let jobDescription = "";
  let resume = "";
  let profileText = "";

  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      resume?: string;
      profile?: { targetRole?: string; experienceLevel?: string; preferredType?: string };
    };
    jobDescription = body.jobDescription || "";
    resume = body.resume || "";
    profileText = [
      body.profile?.targetRole ? `Target role: ${body.profile.targetRole}` : "",
      body.profile?.experienceLevel ? `Experience level: ${body.profile.experienceLevel}` : "",
      body.profile?.preferredType ? `Interview focus: ${body.profile.preferredType}` : ""
    ]
      .filter(Boolean)
      .join("\n");
    if ((!jobDescription || jobDescription.trim().length < 40) && (!resume || resume.trim().length < 40)) {
      return NextResponse.json({ error: "Please provide a fuller job description or resume text." }, { status: 400 });
    }

    if (getAIProvider() === "none") {
      return NextResponse.json({ questions: fallbackQuestions });
    }

    const system =
      "Generate exactly five tailored mock interview questions from the job description, candidate profile, and resume (if provided): two technical, two behavioral, and one system design. Calibrate difficulty to the candidate's experience level: junior questions should focus on implementation basics and ownership, mid-senior questions should test tradeoffs and debugging, and lead/principal questions should test architecture, influence, reliability, and scale. If a resume is provided, at least three questions must explicitly mention a concrete resume detail such as a project name, company/domain, tool, technology, metric, user count, dataset size, responsibility, or shipped feature. Keep each question concise enough to speak aloud in under 20 seconds. Do not ask generic role questions when resume evidence exists. Return JSON with a questions array. Each item must have id, type, question, and codingPrompt.";

    const userParts = [] as { text: string }[];
    if (profileText) userParts.push({ text: `Candidate profile:\n${profileText}` });
    if (jobDescription) userParts.push({ text: `Job description:\n${jobDescription}` });
    if (resume) userParts.push({ text: `Resume:\n${resume}` });

    if (getAIProvider() === "gemini") {
      const text = await generateGeminiText({
        model: getQuestionModel(),
        system,
        parts: userParts,
        json: true
      });

      const parsed = JSON.parse(text) as {
        questions?: InterviewQuestion[];
      };

      const questions = normalizeQuestions(parsed.questions || []);
      return NextResponse.json({ questions: ensureResumeAwareQuestions(questions, resume, jobDescription) });
    }

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: getQuestionModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: system
        },
        {
          role: "user",
          content: `${profileText ? `Candidate profile:\n${profileText}\n\n` : ""}${jobDescription ? `Job description:\n${jobDescription}\n\n` : ""}${resume ? `Resume:\n${resume}` : ""}`
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0]?.message.content || "{}") as {
      questions?: InterviewQuestion[];
    };

    const questions = normalizeQuestions(parsed.questions || []);
    return NextResponse.json({ questions: ensureResumeAwareQuestions(questions, resume, jobDescription) });
  } catch {
    return NextResponse.json({ questions: ensureResumeAwareQuestions(fallbackQuestions, resume, jobDescription) });
  }
}

function normalizeQuestions(questions: InterviewQuestion[]) {
  return questions.slice(0, 5).map((question, index) => ({
    id: question.id || `question-${index + 1}`,
    type: question.type,
    question: question.question,
    codingPrompt: Boolean(question.codingPrompt)
  }));
}

function ensureResumeAwareQuestions(questions: InterviewQuestion[], resume?: string, jobDescription?: string) {
  if (!questions.length) return fallbackQuestions;
  if (!resume || resume.trim().length < 40) return questions.length === 5 ? questions : fallbackQuestions;

  const resumeKeywords = extractResumeKeywords(resume, jobDescription);
  const resumeReferenced = questions.filter((question) =>
    resumeKeywords.some((keyword) => question.question.toLowerCase().includes(keyword))
  );

  if (resumeReferenced.length >= 3 && questions.length === 5) return questions;

  const resumeLeadIn = resumeKeywords.slice(0, 4).join(", ");
  const enrichedQuestions: InterviewQuestion[] = [
    {
      id: "resume-technical-1",
      type: "technical",
      question: `You mentioned ${resumeLeadIn}. Can you explain one challenging technical decision from that experience and how you'd improve it today?`,
      codingPrompt: true
    },
    {
      id: "resume-behavioral-1",
      type: "behavioral",
      question: `From your resume, pick a project involving ${resumeLeadIn}. What was your exact contribution and what changed because of your work?`,
      codingPrompt: false
    },
    {
      id: "resume-system-1",
      type: "system_design",
      question: `Using the resume experience around ${resumeLeadIn}, how would you redesign that workflow to handle 10x more users, data, or requests?`,
      codingPrompt: true
    }
  ];

  const merged = [...enrichedQuestions, ...questions].slice(0, 5);
  return normalizeQuestions(merged);
}

function extractResumeKeywords(resume: string, jobDescription?: string) {
  const text = `${resume}\n${jobDescription || ""}`.toLowerCase();
  const candidates = [
    "rust",
    "react",
    "next.js",
    "node",
    "python",
    "java",
    "kubernetes",
    "docker",
    "sql",
    "postgres",
    "aws",
    "gcp",
    "azure",
    "graphql",
    "redis",
    "typescript",
    "javascript",
    "microservices",
    "api",
    "ml",
    "machine learning",
    "pipeline",
    "distributed",
    "performance",
    "scale"
  ];

  const found = candidates.filter((keyword) => text.includes(keyword));
  return found.length ? found : ["your recent project", "your core stack", "your most recent role"];
}
