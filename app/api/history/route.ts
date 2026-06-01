import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { pool, ensureHistoryTable } from "@/lib/db";
import type { AnswerRecord, ExpertAnswerRewrite } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionPayload = {
  id: string;
  date: string;
  role: string;
  type: string;
  score: number;
  feedback: string;
  answers: AnswerRecord[];
  expertAnswerRewrites: ExpertAnswerRewrite[];
};

export async function GET() {
  try {
    const { userId } = await auth();
    console.log("[API/history] GET called, userId:", userId);
    
    if (!userId) {
      console.log("[API/history] No userId, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureHistoryTable();
    const result = await pool.query(
      `SELECT id, role, session_type, score, feedback, answers, expert_answer_rewrites, date_label
       FROM interview_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    console.log("[API/history] Query returned", result.rows.length, "rows");

    const sessions = result.rows.map((row) => ({
      id: row.id as string,
      date: row.date_label as string,
      role: row.role as string,
      type: row.session_type as string,
      score: Number(row.score),
      feedback: row.feedback as string,
      answers: row.answers as AnswerRecord[],
      expertAnswerRewrites: row.expert_answer_rewrites as ExpertAnswerRewrite[]
    }));

    console.log("[API/history] Returning sessions:", sessions.length);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[API/history] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load session history." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    console.log("[API/history] POST called, userId:", userId);
    
    if (!userId) {
      console.log("[API/history] No userId, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { session?: SessionPayload };
    const session = body.session;
    console.log("[API/history] Received session:", session?.id);
    
    if (!session?.id || !session.date || !session.role || !session.type) {
      console.log("[API/history] Incomplete session payload");
      return NextResponse.json({ error: "Session payload is incomplete." }, { status: 400 });
    }

    await ensureHistoryTable();
    console.log("[API/history] Inserting session into database");
    
    await pool.query(
      `INSERT INTO interview_sessions
        (id, user_id, role, session_type, score, feedback, answers, expert_answer_rewrites, date_label)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
       ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        session_type = EXCLUDED.session_type,
        score = EXCLUDED.score,
        feedback = EXCLUDED.feedback,
        answers = EXCLUDED.answers,
        expert_answer_rewrites = EXCLUDED.expert_answer_rewrites,
        date_label = EXCLUDED.date_label`,
      [
        session.id,
        userId,
        session.role,
        session.type,
        session.score,
        session.feedback,
        JSON.stringify(session.answers ?? []),
        JSON.stringify(session.expertAnswerRewrites ?? []),
        session.date
      ]
    );

    console.log("[API/history] Session saved successfully");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API/history] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save session history." },
      { status: 500 }
    );
  }
}
