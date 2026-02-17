import { NextRequest, NextResponse } from "next/server";
import { cases } from "@/lib/cases";

// In-memory cache for Groq responses: "caseId:normalizedQuestion" -> answer
const answerCache = new Map<string, string>();

/** Normalize a string for keyword matching: lowercase, remove punctuation, split into words */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2); // skip tiny words like "is", "a", "the"
}

/** Compute keyword overlap ratio between two sets of keywords */
function keywordOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const matches = a.filter((w) => setB.has(w)).length;
  // Use the smaller set as denominator for a more generous match
  return matches / Math.min(a.length, b.length);
}

function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { casePrompt, caseId, question, previousQuestions } = body;

    if (!casePrompt || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // --- Step 1: Try matching against pre-written Q&A pairs ---
    if (caseId) {
      const caseData = cases.find((c) => c.id === caseId);
      if (caseData) {
        const userKeywords = extractKeywords(question);

        let bestMatch = { overlap: 0, answer: "" };
        for (const qa of caseData.clarifyingQuestions) {
          const qaKeywords = extractKeywords(qa.question);
          const overlap = keywordOverlap(userKeywords, qaKeywords);
          if (overlap > bestMatch.overlap) {
            bestMatch = { overlap, answer: qa.answer };
          }
        }

        if (bestMatch.overlap > 0.4) {
          console.log(`[clarify] Pre-written match for "${question}" (overlap: ${(bestMatch.overlap * 100).toFixed(0)}%)`);
          return NextResponse.json({ answer: bestMatch.answer });
        }
      }
    }

    // --- Step 2: Check in-memory cache ---
    const cacheKey = `${caseId || "unknown"}:${normalizeQuestion(question)}`;
    const cached = answerCache.get(cacheKey);
    if (cached) {
      console.log(`[clarify] Cache hit for "${question}"`);
      return NextResponse.json({ answer: cached });
    }

    // --- Step 3: Call Groq API ---
    console.log(`[clarify] API call for "${question}"`);

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

    // Store in cache for future requests
    answerCache.set(cacheKey, answer);

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
