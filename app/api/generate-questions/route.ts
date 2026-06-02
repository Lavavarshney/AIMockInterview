import { NextResponse } from "next/server";
import { generateGeminiText, getAIClient, getAIProvider, getQuestionModel } from "@/lib/ai";
import type { InterviewQuestion } from "@/lib/types";

export const runtime = "nodejs";

type CandidateProfile = {
  targetRole?: string;
  experienceLevel?: string;
  preferredType?: string;
  targetDuration?: string;
};

export async function POST(request: Request) {
  let jobDescription = "";
  let resume = "";
  let profileText = "";
  let profile: CandidateProfile = {};

  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      resume?: string;
      profile?: CandidateProfile;
    };
    jobDescription = body.jobDescription || "";
    resume = body.resume || "";
    profile = body.profile || {};
    const targetCount = getQuestionCount(profile.targetDuration);
    const focusPlan = getFocusPlan(profile.preferredType, targetCount);
    profileText = [
      profile.targetRole ? `Target role: ${profile.targetRole}` : "",
      profile.experienceLevel ? `Experience level: ${profile.experienceLevel}` : "",
      profile.preferredType ? `Interview focus: ${profile.preferredType}` : "",
      profile.targetDuration ? `Target duration: ${profile.targetDuration}` : "",
      `Question count: ${targetCount}`,
      `Question mix: ${focusPlan.description}`
    ]
      .filter(Boolean)
      .join("\n");
    if ((!jobDescription || jobDescription.trim().length < 40) && (!resume || resume.trim().length < 40)) {
      return NextResponse.json({ error: "Please provide a fuller job description or resume text." }, { status: 400 });
    }

    if (getAIProvider() === "none") {
      return NextResponse.json({
        questions: buildFallbackQuestions(jobDescription, resume, profile),
        meta: buildMeta(profile, true)
      });
    }

    const system =
      `Generate exactly ${targetCount} tailored mock interview questions from the job description, candidate profile, and resume. The interview focus is ${profile.preferredType || "Technical"} and the required question mix is: ${focusPlan.description}. The target role must shape every question; do not ask generic software-engineering questions if the JD or role gives a stronger angle. Calibrate difficulty to ${profile.experienceLevel || "Mid-Senior"}: junior questions should test fundamentals and ownership, mid-senior questions should test tradeoffs and debugging, and lead/principal questions should test architecture, influence, reliability, and scale. If resume text is provided, at least ${Math.min(3, targetCount)} questions must explicitly mention a concrete resume detail such as a project, company/domain, tool, technology, metric, user count, dataset size, responsibility, or shipped feature. Keep each question concise enough to speak aloud in under 15 seconds. Return JSON only with a questions array. Each item must have id, type, question, and codingPrompt. Valid types: technical, behavioral, system_design.`;

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

      const questions = normalizeQuestions(parsed.questions || [], targetCount, profile, jobDescription, resume);
      return NextResponse.json({
        questions: ensureResumeAwareQuestions(questions, resume, jobDescription, profile),
        meta: buildMeta(profile, false)
      });
    }

    const ai = getAIClient();
    const completion = await ai.chat.completions.create({
      model: getQuestionModel(),
      max_tokens: 1600,
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

    const questions = normalizeQuestions(parsed.questions || [], targetCount, profile, jobDescription, resume);
    return NextResponse.json({
      questions: ensureResumeAwareQuestions(questions, resume, jobDescription, profile),
      meta: buildMeta(profile, false)
    });
  } catch (error) {
    console.error("Question generation failed; using strict focus fallback.", error);
    return NextResponse.json({
      questions: ensureResumeAwareQuestions(buildFallbackQuestions(jobDescription, resume, profile), resume, jobDescription, profile),
      meta: buildMeta(profile, true, error)
    });
  }
}

function normalizeQuestions(
  questions: InterviewQuestion[],
  targetCount: number,
  profile?: CandidateProfile,
  jobDescription = "",
  resume = ""
) {
  const fallback = buildFallbackQuestions(jobDescription, resume, profile);
  const valid: InterviewQuestion[] = questions
    .filter((question) => question?.question?.trim())
    .map((question, index) => ({
      id: String(question.id || `${question.type || "question"}-${index + 1}`),
      type: (question.type === "behavioral" || question.type === "system_design" ? question.type : "technical") as InterviewQuestion["type"],
      question: question.question.trim(),
      codingPrompt: Boolean(question.codingPrompt)
    }));

  return enforceFocusMix([...valid, ...fallback], fallback, profile)
    .slice(0, targetCount)
    .map((question, index) => ({
    ...question,
    id: question.id || `question-${index + 1}`
  }));
}

function ensureResumeAwareQuestions(
  questions: InterviewQuestion[],
  resume?: string,
  jobDescription?: string,
  profile?: CandidateProfile
) {
  const targetCount = getQuestionCount(profile?.targetDuration);
  if (!questions.length) return buildFallbackQuestions(jobDescription || "", resume || "", profile);
  if (!resume || resume.trim().length < 40) {
    return normalizeQuestions(questions, targetCount, profile);
  }

  const resumeKeywords = extractResumeKeywords(resume, jobDescription);
  const resumeReferenced = questions.filter((question) =>
    resumeKeywords.some((keyword) => question.question.toLowerCase().includes(keyword))
  );

  if (resumeReferenced.length >= Math.min(3, targetCount) && questions.length === targetCount) {
    return enforceFocusMix(questions, buildFallbackQuestions(jobDescription || "", resume || "", profile), profile).slice(0, targetCount);
  }

  const resumeLeadIn = resumeKeywords.slice(0, 4).join(", ");
  const enrichedQuestions = buildResumeAwareQuestions(resumeLeadIn, profile);

  const merged = [...enrichedQuestions, ...questions].slice(0, targetCount);
  return normalizeQuestions(merged, targetCount, profile, jobDescription, resume);
}

function getQuestionCount(duration?: string) {
  if (duration?.includes("45")) return 10;
  if (duration?.includes("30")) return 8;
  return 5;
}

function getFocusPlan(focus?: string, count = 5) {
  const normalized = (focus || "Technical").toLowerCase();
  if (normalized.includes("hr") || normalized.includes("behavior")) {
    return {
      description: `${count} behavioral questions focused on role fit, ownership, communication, conflict, feedback, and motivation.`
    };
  }
  if (normalized.includes("dsa")) {
    return {
      description: `${count} DSA/coding questions. Use type technical and codingPrompt true. Questions should test algorithms, data structures, complexity, edge cases, and implementation strategy for the target role.`
    };
  }
  if (normalized.includes("system")) {
    return {
      description: `${Math.max(3, Math.round(count * 0.7))} system-design questions, ${Math.max(1, Math.floor(count * 0.2))} technical tradeoff questions, and at most one behavioral leadership question.`
    };
  }
  return {
    description: `${Math.max(3, Math.round(count * 0.6))} role-specific technical questions, ${Math.max(1, Math.floor(count * 0.2))} behavioral questions, and ${Math.max(1, count - Math.max(3, Math.round(count * 0.6)) - Math.max(1, Math.floor(count * 0.2)))} system-design question(s).`
  };
}

function enforceFocusMix(questions: InterviewQuestion[], fallback: InterviewQuestion[], profile?: CandidateProfile) {
  const targetCount = getQuestionCount(profile?.targetDuration);
  const focus = (profile?.preferredType || "Technical").toLowerCase();
  const combined = dedupeQuestions([...questions, ...fallback]);

  if (focus.includes("hr") || focus.includes("behavior")) {
    return combined
      .filter((question) => question.type === "behavioral")
      .concat(fallback.filter((question) => question.type === "behavioral"))
      .slice(0, targetCount)
      .map((question) => ({ ...question, codingPrompt: false }));
  }

  if (focus.includes("dsa")) {
    return combined
      .filter((question) => question.type === "technical")
      .concat(fallback)
      .slice(0, targetCount)
      .map((question) => ({ ...question, type: "technical" as const, codingPrompt: true }));
  }

  if (focus.includes("system")) {
    const system = combined.filter((question) => question.type === "system_design");
    const technical = combined.filter((question) => question.type === "technical");
    const behavioral = combined.filter((question) => question.type === "behavioral");
    return [...system, ...technical.slice(0, 2), ...behavioral.slice(0, 1), ...fallback].slice(0, targetCount);
  }

  const technical = combined.filter((question) => question.type === "technical");
  const system = combined.filter((question) => question.type === "system_design");
  const behavioral = combined.filter((question) => question.type === "behavioral");
  return [...technical, ...system.slice(0, 2), ...behavioral.slice(0, 2), ...fallback].slice(0, targetCount);
}

function dedupeQuestions(questions: InterviewQuestion[]) {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = question.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildResumeAwareQuestions(resumeLeadIn: string, profile?: CandidateProfile): InterviewQuestion[] {
  const focus = (profile?.preferredType || "Technical").toLowerCase();
  const role = profile?.targetRole || "this role";

  if (focus.includes("hr") || focus.includes("behavior")) {
    return [
      q("behavioral", `Your resume mentions ${resumeLeadIn}. What was your exact contribution, and what outcome did it create?`),
      q("behavioral", `In the ${resumeLeadIn} work, tell me about one disagreement or constraint you had to navigate.`),
      q("behavioral", `Which resume project best proves you are ready for ${role}, and what would your manager say you owned?`)
    ];
  }

  if (focus.includes("dsa")) {
    return [
      q("technical", `Using the ${resumeLeadIn} domain, design a coding problem involving efficient lookup or aggregation. Explain the optimal approach.`, true),
      q("technical", `For data from ${resumeLeadIn}, how would you find top-K or duplicate records efficiently? Cover complexity.`, true),
      q("technical", `Turn one ${resumeLeadIn} workflow into an algorithm question. What edge cases would you test?`, true)
    ];
  }

  if (focus.includes("system")) {
    return [
      q("system_design", `Using your ${resumeLeadIn} experience, redesign that workflow for 10x load. Cover APIs, data model, reliability, and metrics.`, true),
      q("system_design", `For the ${resumeLeadIn} system, what would you cache, queue, monitor, and alert on?`, true),
      q("system_design", `How would you evolve the ${resumeLeadIn} architecture if the product became business-critical?`, true)
    ];
  }

  return [
    q("technical", `You mentioned ${resumeLeadIn}. Explain one technical decision from that work and the tradeoff behind it.`, true),
    q("technical", `In your ${resumeLeadIn} experience, how did you test, debug, or improve reliability?`),
    q("system_design", `How would you scale the workflow behind ${resumeLeadIn} for this ${role} role?`, true)
  ];
}

function buildMeta(profile: CandidateProfile, fallbackUsed: boolean, error?: unknown) {
  return {
    provider: getAIProvider(),
    model: getAIProvider() === "none" ? "local-fallback" : getQuestionModel(),
    fallbackUsed,
    error: error instanceof Error ? error.message.slice(0, 220) : undefined,
    focus: profile.preferredType || "Technical",
    duration: profile.targetDuration || "30 Min",
    questionCount: getQuestionCount(profile.targetDuration)
  };
}

function buildFallbackQuestions(jobDescription: string, resume: string, profile?: CandidateProfile) {
  const targetCount = getQuestionCount(profile?.targetDuration);
  const role = profile?.targetRole?.trim() || inferRole(jobDescription) || "this role";
  const level = profile?.experienceLevel || "Mid-Senior";
  const keywords = extractResumeKeywords(resume || jobDescription || role, jobDescription).slice(0, 4);
  const stack = keywords.join(", ");
  const normalizedFocus = (profile?.preferredType || "Technical").toLowerCase();

  let pool: InterviewQuestion[];
  if (normalizedFocus.includes("hr") || normalizedFocus.includes("behavior")) {
    pool = [
      q("behavioral", `For a ${role} role, tell me about a time you owned an ambiguous problem end to end. What changed because of your work?`),
      q("behavioral", `Describe a conflict or disagreement you had while working with ${stack}. How did you handle it?`),
      q("behavioral", `Tell me about difficult feedback you received as a ${level} candidate. What did you change afterward?`),
      q("behavioral", `Give an example where you had to influence engineers, designers, or stakeholders without authority.`),
      q("behavioral", `Why does this ${role} position fit your recent experience, and where do you still need to grow?`),
      q("behavioral", `Tell me about a deadline or production issue related to ${stack}. How did you prioritize?`),
      q("behavioral", `Describe a time you improved team quality, review process, documentation, or delivery speed.`),
      q("behavioral", `What is one mistake from your resume experience that you would handle differently now?`),
      q("behavioral", `How do you communicate technical risk to non-technical stakeholders?`),
      q("behavioral", `What kind of role-specific impact would you try to create in your first 90 days as a ${role}?`)
    ];
  } else if (normalizedFocus.includes("dsa")) {
    pool = [
      q("technical", `For ${role}, solve a realistic problem using arrays or hash maps. Explain the optimal approach, complexity, and edge cases.`, true),
      q("technical", `Design an algorithm to process high-volume ${stack} related events with deduplication. What data structure would you use?`, true),
      q("technical", `Given a stream of user actions for a ${role} product, find the top K frequent events efficiently.`, true),
      q("technical", `Explain how you would detect cycles or dependency loops in a workflow relevant to this JD.`, true),
      q("technical", `Write the approach for a sliding-window or two-pointer problem that could appear in this role's coding round.`, true),
      q("technical", `How would you optimize a slow recursive or dynamic-programming solution, and what tradeoffs matter?`, true),
      q("technical", `Choose one graph/search problem related to the product domain and explain BFS versus DFS tradeoffs.`, true),
      q("technical", `How would you test edge cases for an algorithm before submitting code in an interview?`, true),
      q("technical", `Explain time and space complexity for a solution using ${stack || "your core stack"}.`, true),
      q("technical", `What coding pattern do you reach for when brute force is too slow, and why?`, true)
    ];
  } else if (normalizedFocus.includes("system")) {
    pool = [
      q("system_design", `Design the core ${role} workflow from this JD. Cover APIs, data model, reliability, and observability.`, true),
      q("system_design", `How would you scale a ${stack} based feature to 10x traffic while keeping latency predictable?`, true),
      q("system_design", `Design authentication, authorization, and audit logging for a product owned by a ${role}.`, true),
      q("system_design", `What failure modes would you plan for in the most important system from this JD?`, true),
      q("system_design", `Design the monitoring and alerting strategy for a production feature in this role.`, true),
      q("technical", `What technical tradeoff would you make between speed of delivery and long-term maintainability for ${role}?`),
      q("system_design", `How would you model data and APIs for a dashboard or workflow mentioned in the JD?`, true),
      q("system_design", `What caching, queueing, or async processing would you use for this domain, and why?`, true),
      q("technical", `How would you debug a reliability regression in a ${stack} service?`),
      q("behavioral", `Tell me about a time you pushed back on an architecture decision and what happened.`)
    ];
  } else {
    pool = [
      q("technical", `For this ${role} JD, which technical requirement is most important, and how would you implement it?`, true),
      q("technical", `Walk me through a ${stack} project from your background and the hardest tradeoff you made.`),
      q("technical", `How would you debug a production issue in a ${role} workflow using logs, metrics, and tests?`),
      q("system_design", `Design a small but scalable version of the core workflow for this ${role} role.`, true),
      q("behavioral", `Tell me about a time you had to influence a team while delivering work relevant to ${role}.`),
      q("technical", `What code quality, testing, and deployment practices would you apply for this JD?`),
      q("technical", `Explain one performance bottleneck that could happen in a ${stack} product and how you would fix it.`),
      q("behavioral", `Describe a time you received feedback on your technical work and changed your approach.`),
      q("system_design", `How would you make the system observable and reliable for users of this product?`, true),
      q("technical", `What would you build in your first month as a ${role}, and how would you measure success?`)
    ];
  }

  return pool.slice(0, targetCount).map((question, index) => ({
    ...question,
    id: `${question.type}-${index + 1}`
  }));
}

function q(type: InterviewQuestion["type"], question: string, codingPrompt = false): InterviewQuestion {
  return { id: "", type, question, codingPrompt };
}

function inferRole(jobDescription: string) {
  const titleMatch = jobDescription.match(/\b(?:role|position|title)\s*[:\-]\s*([^\n.]+)/i);
  if (titleMatch?.[1]) return titleMatch[1].trim().slice(0, 80);
  const commonRoles = [
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Web Designer",
    "Data Scientist",
    "Product Manager",
    "DevOps Engineer",
    "QA Engineer",
    "UX Designer"
  ];
  return commonRoles.find((role) => jobDescription.toLowerCase().includes(role.toLowerCase())) || "";
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
