import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
  }

  try {
    const { casePrompt, hypothesisTranscript } = await request.json();

    if (!casePrompt || !hypothesisTranscript) {
      return NextResponse.json({ error: "Missing casePrompt or hypothesisTranscript" }, { status: 400 });
    }

    const prompt = `You are an expert consulting interview evaluator from McKinsey, BCG, or Bain.

The candidate is doing a focused drill to practice their Hypothesis & Prioritization skill.

## Original Case Prompt
${casePrompt}

## Candidate's Hypothesis (spoken aloud)
${hypothesisTranscript}

## What to Evaluate
Score ONLY the Hypothesis & Prioritization dimension on a 1–5 scale using these anchors:
- 1: No hypothesis stated and no indication of where to start
- 2: Weak signal ("I think costs might be important") but no explicit prioritization
- 3: States a hypothesis or indicates one area to prioritize, with minimal reasoning
- 4: States a clear hypothesis tied to the case context and explains why they would start there
- 5: Crisp hypothesis reflecting case-specific insight, with a logical prioritization order for all buckets

## Output Style Rules
- comment: exactly 1 sentence on what they said + 1 sentence with a concrete action. 2 sentences total.
- Each suggestion: 1 imperative sentence with example phrasing they could use right now.
- Never write "Great job!", "Consider trying", or vague openers.

Respond in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "score": 0,
  "comment": "",
  "suggestions": ["", ""]
}`;

    let content = "";

    const tryGroq = async (model: string, temperature = 0.5): Promise<string | null> => {
      if (!process.env.GROQ_API_KEY) return null;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are an expert consulting interview evaluator. Always respond with valid JSON only — no markdown, no code fences." },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: 512,
        }),
      });
      if (!res.ok) { console.warn(`Groq ${model} failed (${res.status})`); return null; }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    };

    const tryGemini = async (model: string, temperature = 0.5): Promise<string | null> => {
      if (!process.env.GEMINI_API_KEY) return null;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: 512, responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) { console.warn(`Gemini ${model} failed (${res.status})`); return null; }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    };

    content = (await tryGemini("gemini-2.0-flash", 0.5)) ?? "";
    if (!content) content = (await tryGroq("llama-3.3-70b-versatile", 0.4)) ?? "";
    if (!content) content = (await tryGroq("llama-3.1-8b-instant", 0.2)) ?? "";
    if (!content) content = (await tryGemini("gemini-1.5-flash", 0.4)) ?? "";

    if (!content) {
      return NextResponse.json({ error: "All AI providers unavailable — please try again" }, { status: 503 });
    }

    // Strip markdown fences
    const fenceMatch = content.trim().match(/^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) content = fenceMatch[1].trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try { result = JSON.parse(content.slice(start, end + 1)); } catch { /* fall through */ }
      }
    }

    if (!result || typeof result.score !== "number") {
      return NextResponse.json({ error: "Failed to parse evaluation response" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Hypothesis evaluation error:", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
