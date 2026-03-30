import { NextResponse } from "next/server";
import OpenAI from "openai";
import { authSession } from "@/lib/auth/session-adapter";

export const dynamic = "force-dynamic";

const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  LEADERSHIP: "Leadership",
  CULTURE_FIT: "Culture Fit",
  COMPENSATION: "Compensation",
  OTHER: "Other",
};

export async function POST(req: Request) {
  try {
    const session = await authSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local." },
        { status: 503 },
      );
    }

    const { question, answerHints, category } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const categoryLabel = category ? (QUESTION_CATEGORY_LABELS[category] ?? category) : "Interview";

    const prompt = `You are an expert interview coach. Generate a strong, structured answer for the following ${categoryLabel} interview question.

Question: ${question}
${answerHints ? `Answer hints / notes: ${answerHints}` : ""}

Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "answer": "Your complete, well-structured answer here (3-5 sentences or bullet points if more appropriate for this question type). Use STAR format for behavioral questions.",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach. Always respond with valid JSON matching the requested format exactly.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { answer: string; tips: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ answer: raw, tips: [] });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[api/ai/suggest-answer]", err);
    return NextResponse.json({ error: "Failed to generate answer suggestion" }, { status: 500 });
  }
}
