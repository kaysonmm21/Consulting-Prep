import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { casePrompt, question, previousQuestions } = body;

    if (!casePrompt || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const previousQAContext =
      previousQuestions && previousQuestions.length > 0
        ? previousQuestions
            .map((q: { question: string; answer: string }, i: number) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`)
            .join("\n\n")
        : "None yet.";

    const systemPrompt = `You are a consulting interviewer at a top firm (McKinsey, BCG, or Bain). A candidate has just read the case prompt and is now asking clarifying questions before building their framework.

## Your Role
- Act as a friendly but professional interviewer
- Answer reasonable clarifying questions concisely (1-3 sentences)
- If the candidate asks something too specific or dives into analysis they should figure out themselves, politely deflect with something like: "That's something I'd want you to explore in your framework" or "Great question — I'd like to see how you think about that in your analysis"
- Do NOT give away the answer to the case or reveal the key insight
- Stay in character at all times
- Keep answers brief — this is a timed exercise

## Case Prompt
${casePrompt}

## Previous Questions in This Session
${previousQAContext}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      const isQuota = response.status === 429;
      const isOverloaded = response.status === 503;
      return NextResponse.json(
        {
          error: isQuota
            ? "API quota exceeded — please wait a minute and try again"
            : isOverloaded
              ? "The AI model is temporarily overloaded — please try again in a moment"
              : `Clarify API failed (status ${response.status})`,
        },
        { status: isQuota ? 429 : isOverloaded ? 503 : 500 }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "I'm not sure how to answer that — let's move on.";

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Clarify error:", err);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Network error — could not reach the AI API"
        : `Clarify failed: ${err instanceof Error ? err.message : "unexpected error"}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
