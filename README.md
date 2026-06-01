# HireFlow

HireFlow is a complete Next.js 14 App Router app for running an AI-powered mock interview in the browser. It generates tailored interview questions from a pasted job description, speaks them aloud, records voice answers with live transcription, captures coding screenshots, and returns a structured Markdown feedback report.

## Features

- Paste a job description and generate 5 tailored questions.
- Question mix: 2 technical, 2 behavioral, 1 system design.
- Browser SpeechSynthesis for spoken interviewer prompts.
- Browser SpeechRecognition with interim transcript and silence auto-stop.
- Screen sharing via `navigator.mediaDevices.getDisplayMedia`.
- Screenshot capture with Canvas `toDataURL`.
- Gemini, Groq, or OpenAI for question generation, natural phrasing, and feedback.
- Gemini and OpenAI can evaluate transcript plus screenshots; Groq mode evaluates transcript text and notes captured screenshots.
- In-memory state with React Context and `useReducer`.
- Clerk authentication, still no database.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add your environment variables:

```bash
cp .env.example .env.local
```

For login, create a Clerk application and set:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Enable Google as a social connection in the Clerk dashboard if you want the Clerk modal to show Google login.

For Gemini, set:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
```

`GOOGLE_API_KEY` also works if that is the variable name you already use.

Optional model overrides:

```bash
GEMINI_QUESTION_MODEL=gemini-2.5-flash
GEMINI_EVALUATION_MODEL=gemini-2.5-flash
```

For Groq instead:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key_here
```

For OpenRouter instead:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_QUESTION_MODEL=google/gemini-2.0-flash-001
OPENROUTER_EVALUATION_MODEL=google/gemini-2.0-flash-001
```

For OpenAI instead:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key_here
```

3. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Voice recognition support varies by browser. Chromium-based browsers are the best fit.
- Screen capture requires a secure context. `localhost` is allowed during development.
- If no AI key is configured, the app falls back to local placeholder questions and a placeholder feedback report so you can still test the flow.
- Gemini uses the Google `generateContent` endpoint and sends captured screenshots as inline image parts.
- Groq's OpenAI-compatible Chat Completions endpoint is used via `https://api.groq.com/openai/v1`.
