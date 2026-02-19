import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { casePrompt, caseTitle, caseCategory, userQuestions } = body;

    if (!casePrompt || !userQuestions || !Array.isArray(userQuestions)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const filteredQuestions = (userQuestions as string[]).filter((q) => q.trim().length > 0);

    if (filteredQuestions.length === 0) {
      return NextResponse.json({ error: "No questions provided" }, { status: 400 });
    }

    const prompt = `You are an experienced MBB case coach — McKinsey Senior Manager, fifteen years of interviewing candidates. You give direct, calibrated feedback with no filler.

## The Purpose of Clarifying Questions

Clarifying questions ensure the candidate:
1. Solves the right problem
2. Defines success correctly
3. Avoids building the wrong framework

The goal is not to impress — it is to remove ambiguity. Questions should take 30–60 seconds total, not minutes.

## The 5 High-Impact Categories (in priority order)

These are the categories that matter most. A complete clarifying phase covers the ones relevant to the case.

**1. Objective (Most Important)**
What is the primary goal — profit, revenue, market share, cost reduction? Is there a target level? Short-term or long-term? Growth or profitability?
→ If the objective changes, the framework changes. Always ask this first.

**2. Time Horizon**
What timeframe are we considering? Short-term → tactical levers. Long-term → strategic investments.

**3. Scope**
Geography? Product line or full company? Specific customer segment or all customers? Prevents overly broad or irrelevant frameworks.

**4. Constraints**
Budget? Regulatory? Capacity? Brand limitations? Adds realism and prevents impractical recommendations.

**5. Success Definition**
How will success be measured? Are there trade-offs — profit vs. market share? Aligns analysis to the right metric.

## What Makes a Question Strong

A strong question meets ALL of these:
- Passes the litmus test: "If the answer changes, would my framework change? If not — don't ask it."
- Addresses a genuine unknown — not something inferable from the prompt
- Sits at the right scope: not too broad ("Tell me about the company") and not too narrow ("What is the CEO's name")
- Demonstrates business judgment — shows understanding of what drives the economics of this case type
- Is organized and concise — ideally grouped by category (objective, scope, constraints, etc.)

## What Makes a Question Weak

- Repeats information already given in the prompt
- Is random and unstructured, showing no deliberate prioritization
- Asks for unnecessary detail that would not change the framework
- Could belong inside the framework rather than before it
- Fails the litmus test — the answer would not change the structure

## What Makes a Question Redundant

- Substantially overlaps with another question the candidate already asked
- Restates information from the prompt as a question

## Case Details

**Title:** ${caseTitle || "Case Interview"}
**Category:** ${caseCategory || "general"}
**Prompt:** ${casePrompt}

## Candidate's Clarifying Questions

${filteredQuestions.map((q, i) => `Q${i + 1}: ${q}`).join("\n")}

## Your Task

**1. Evaluate EACH question individually.**

Assign one rating:
- "strong": Genuinely excellent — passes the litmus test, demonstrates business judgment, and would materially shape the framework.
- "weak": Too vague, too generic, doesn't pass the litmus test, or wouldn't change the framework structure. Do not soften this.
- "redundant": Overlaps substantially with another question asked, or restates prompt information.

Write exactly 1 sentence of feedback per question: name the specific flaw or strength, then give a direct instruction (what to ask instead or how to sharpen it). Do NOT start with "This question" or "You asked."

**2. Generate exactly 4 topQuestions.**

These are the questions an experienced McKinsey associate would actually prioritize for THIS specific case. Each must:
- Be specific to this case's industry, situation, and numbers — not a generic template
- Pass the litmus test — the answer materially alters the framework
- Prioritize the Objective category first, then the most relevant remaining categories
- Be phrased as a candidate would say it in an interview
- Be under 25 words

**3. Write a coachNote.**

1–2 sentences identifying the biggest pattern gap across ALL the candidate's questions. Reference the 5 categories explicitly — name which category was over-represented, which critical category was entirely missed, or what the overall pattern reveals about the candidate's instincts. Be direct. No filler.

Examples of strong coachNotes:
- "Every question targets operational inputs — you haven't asked anything about the objective or what success looks like for this client, which means you could build an entire framework solving the wrong problem."
- "You covered scope and constraints well, but skipped the objective entirely — in a real interview, an interviewer would stop you and ask it themselves."
- "Three of four questions are weak variants of the same scope question; you have no read on time horizon or success definition, which are both likely to reshape the framework for this case type."

## Output Rules

- No "Great job!", "Well done!", "Nice work!", or any evaluative opener before substance.
- Never begin a sentence with "Consider", "Try to", "You should", or "It might be worth."
- Use direct imperatives: "Ask about...", "Replace this with...", "Narrow the scope to...", "Lead with..."
- No filler starters: "Also,", "Additionally,", "Furthermore,", "Overall,"
- topQuestions must be case-specific — a question that could appear on ANY case is disqualified.

Respond in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "evaluations": [
    {
      "question": "the user's question text verbatim",
      "rating": "strong" | "weak" | "redundant",
      "feedback": "1 sentence — flaw or strength + direct instruction"
    }
  ],
  "topQuestions": [
    "question 1",
    "question 2",
    "question 3",
    "question 4"
  ],
  "coachNote": "1-2 sentences naming the category gap and what it signals"
}`;

    let content = "";

    const groqSystemMsg =
      "You are an expert consulting interview coach. Always respond with valid JSON only — no markdown, no code fences.";

    const tryGroq = async (model: string, temperature: number = 0.7): Promise<string | null> => {
      if (!process.env.GROQ_API_KEY) return null;
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: groqSystemMsg },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: 2048,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        const retryable = res.status === 429 || res.status === 503;
        console.warn(`Groq ${model} failed (${res.status}): ${err}`);
        return retryable ? null : "HARD_FAIL";
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    };

    const tryGemini = async (model: string, temperature: number = 0.7): Promise<string | null> => {
      if (!process.env.GEMINI_API_KEY) return null;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: 2048, responseMimeType: "application/json" },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        console.warn(`Gemini ${model} failed (${res.status}): ${err}`);
        return null;
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    };

    // Cascade: gemini-2.0-flash (t=0.7) → groq 70b (t=0.4) → groq 8b (t=0.2) → gemini-1.5-flash (t=0.4)
    content = (await tryGemini("gemini-2.0-flash", 0.7)) ?? "";

    if (!content) {
      console.warn("gemini-2.0-flash failed, trying groq llama-3.3-70b...");
      const r = await tryGroq("llama-3.3-70b-versatile", 0.4);
      if (r && r !== "HARD_FAIL") content = r;
    }

    if (!content) {
      console.warn("groq 70b failed, trying groq llama-3.1-8b-instant...");
      const r = await tryGroq("llama-3.1-8b-instant", 0.2);
      if (r && r !== "HARD_FAIL") content = r;
    }

    if (!content) {
      console.warn("groq 8b failed, trying gemini-1.5-flash...");
      content = (await tryGemini("gemini-1.5-flash", 0.4)) ?? "";
    }

    if (!content) {
      return NextResponse.json(
        { error: "All AI providers are unavailable — please try again in a minute" },
        { status: 503 }
      );
    }

    // Strip markdown code fences that Gemini sometimes wraps around JSON
    content = stripMarkdownCodeFences(content);

    // Parse JSON from response, with robust extraction for nested objects
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Extract the outermost balanced JSON object by counting braces
      const extracted = extractOutermostJson(content);
      if (extracted) {
        try {
          result = JSON.parse(extracted);
        } catch (innerErr) {
          // Attempt to repair truncated JSON by closing open braces/brackets
          const repaired = repairTruncatedJson(extracted);
          if (repaired) {
            try {
              result = JSON.parse(repaired);
            } catch (repairErr) {
              console.error("JSON parse failed even after repair:", repairErr, "\nExtracted:", extracted.slice(0, 500));
              return NextResponse.json(
                { error: "Failed to parse coach response — the AI returned malformed JSON" },
                { status: 502 }
              );
            }
          } else {
            console.error("JSON parse failed even after extraction:", innerErr, "\nExtracted:", extracted.slice(0, 500));
            return NextResponse.json(
              { error: "Failed to parse coach response — the AI returned malformed JSON" },
              { status: 502 }
            );
          }
        }
      } else {
        const repaired = repairTruncatedJson(content);
        if (repaired) {
          try {
            result = JSON.parse(repaired);
          } catch (repairErr) {
            console.error("JSON parse failed after truncation repair:", repairErr, "\nContent:", content.slice(0, 500));
            return NextResponse.json(
              { error: "Failed to parse coach response — the AI returned truncated JSON" },
              { status: 502 }
            );
          }
        } else {
          console.error("No JSON object found in response:", content.slice(0, 500));
          return NextResponse.json(
            { error: "Failed to parse coach response — no JSON found in AI output" },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Coach questions error:", err);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Network error — could not reach the AI API"
        : `Coach questions failed: ${err instanceof Error ? err.message : "unexpected error"}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Extract the outermost balanced `{...}` from a string, handling nested braces. */
function extractOutermostJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  // If we get here, braces never balanced (truncated response).
  // Return everything from start to end so the caller can attempt repair.
  if (start !== -1 && depth > 0) {
    return text.slice(start);
  }

  return null;
}

/** Strip markdown code fences (```json ... ``` or ``` ... ```) from AI output. */
function stripMarkdownCodeFences(text: string): string {
  const trimmed = text.trim();
  // Match ```json ... ``` or ``` ... ``` with optional language tag
  const fenceMatch = trimmed.match(/^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Also handle case where fences appear but content continues after or before
  const innerMatch = trimmed.match(/```(?:json|JSON)?\s*\n([\s\S]*?)\n\s*```/);
  if (innerMatch) {
    return innerMatch[1].trim();
  }
  return text;
}

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 * Returns the repaired string or null if the input doesn't look like JSON.
 */
function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let json = text.slice(start);

  // If it already parses, just return it
  try {
    JSON.parse(json);
    return json;
  } catch {
    // Continue with repair
  }

  // Track open braces, brackets, and string state
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // If we ended inside a string, close it
  if (inString) {
    json += '"';
  }

  // Remove any trailing comma or colon that would make the JSON invalid
  json = json.replace(/[,:\s]+$/, "");

  // Close all open braces/brackets in reverse order
  while (stack.length > 0) {
    json += stack.pop();
  }

  return json;
}
