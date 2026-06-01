import OpenAI from "openai";

export type AIProvider = "openai" | "groq" | "gemini" | "openrouter" | "none";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "gemini") return "gemini";
  if (process.env.AI_PROVIDER === "openrouter") return "openrouter";
  if (process.env.AI_PROVIDER === "groq") return "groq";
  if (process.env.AI_PROVIDER === "openai") return "openai";
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export function getAIClient() {
  const provider = getAIProvider();

  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "HireFlow"
      }
    });
  }

  throw new Error("No AI provider is configured.");
}

export function getQuestionModel() {
  const provider = getAIProvider();
  if (provider === "gemini") return process.env.GEMINI_QUESTION_MODEL || "gemini-2.5-flash";
  if (provider === "openrouter") return process.env.OPENROUTER_QUESTION_MODEL || "google/gemini-2.0-flash-001";
  if (provider === "groq") return process.env.GROQ_QUESTION_MODEL || "llama-3.3-70b-versatile";
  return process.env.OPENAI_QUESTION_MODEL || "gpt-4o-mini";
}

export function getEvaluationModel() {
  const provider = getAIProvider();
  if (provider === "gemini") return process.env.GEMINI_EVALUATION_MODEL || "gemini-2.5-flash";
  if (provider === "openrouter") return process.env.OPENROUTER_EVALUATION_MODEL || "google/gemini-2.0-flash-001";
  if (provider === "groq") return process.env.GROQ_EVALUATION_MODEL || "llama-3.3-70b-versatile";
  return process.env.OPENAI_EVALUATION_MODEL || "gpt-4o";
}

export function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured.");
  }

  return apiKey;
}

export function dataUrlToGeminiPart(dataUrl: string): GeminiPart | null {
  const match = dataUrl.match(/^data:([-\w/.+]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) return null;

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2]
    }
  };
}

export async function generateGeminiText({
  model,
  system,
  parts,
  json = false
}: {
  model: string;
  system: string;
  parts: GeminiPart[];
  json?: boolean;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getGeminiApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }]
        },
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: json
          ? {
              responseMimeType: "application/json"
            }
          : undefined
      })
    }
  );

  const data = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed.");
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
