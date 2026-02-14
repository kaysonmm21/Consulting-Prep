import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      casePrompt,
      transcript,
      frameworkTime,
      presentationTime,
      showedTranscript,
      clarifyingQuestionsViewed,
      totalClarifyingQuestions,
    } = body;

    const prompt = `You are an expert consulting interview evaluator from McKinsey, BCG, or Bain. You are evaluating a candidate's case framework presentation.

## Original Case Prompt
${casePrompt}

## Candidate's Framework Presentation (Transcribed from audio)
${transcript}

## Session Metadata
- Time spent building framework: ${frameworkTime} seconds
- Time spent presenting: ${presentationTime} seconds
- Showed case transcript (instead of just listening): ${showedTranscript}
- Clarifying questions asked: ${clarifyingQuestionsViewed?.length || 0} out of ${totalClarifyingQuestions} available

## Evaluation Instructions

Score each dimension from 1-5 (1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent).

Evaluate:
1. **MECE** — Are the framework buckets mutually exclusive (no overlap) and collectively exhaustive (covers all key areas)?
2. **Case Fit** — Is the framework specifically tailored to this case, or is it a generic/memorized structure?
3. **Prioritization** — Did the candidate indicate which areas to explore first and provide reasoning?
4. **Depth** — Are there meaningful sub-points under each bucket? Are they specific and actionable?
5. **Hypothesis** — Did the candidate state an initial hypothesis before or during the framework?
6. **Clarifying Questions** — Quality assessment based on how many and which clarifying questions they chose to ask.
7. **Delivery** — Was the presentation structured (top-down), clear, and confident? Did they signpost?
8. **Filler Words** — Count filler words (um, uh, like, so basically, you know, kind of, sort of, I mean, right). Lower count = higher score.

Also provide:
- A suggested stronger framework for this specific case
- The candidate's top strength and #1 area for improvement
- Specific, actionable feedback for each dimension

Respond in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "scores": {
    "overall": 0,
    "mece": 0,
    "caseFit": 0,
    "prioritization": 0,
    "depth": 0,
    "hypothesis": 0,
    "clarifyingQuestions": 0,
    "delivery": 0,
    "fillerWords": 0
  },
  "feedback": {
    "summary": "",
    "meceComment": "",
    "caseFitComment": "",
    "prioritizationComment": "",
    "depthComment": "",
    "hypothesisComment": "",
    "clarifyingQuestionsComment": "",
    "deliveryComment": "",
    "fillerWordsComment": "",
    "fillerWordCount": 0,
    "fillerWordList": [],
    "suggestedFramework": {
      "buckets": [{"name": "", "subPoints": [""]}],
      "explanation": ""
    },
    "topStrength": "",
    "topImprovement": ""
  }
}`;

    const fetchGemini = async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      return res;
    };

    let response = await fetchGemini();

    // Retry once after a short delay for transient errors (429, 500, 503)
    if (response.status === 429 || response.status === 500 || response.status === 503) {
      console.warn(`Gemini API returned ${response.status}, retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await fetchGemini();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      const isQuota = response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota");
      const isOverloaded = response.status === 503 || errorText.includes("UNAVAILABLE");
      return NextResponse.json(
        {
          error: isQuota
            ? "API quota exceeded — please wait a minute and try again"
            : isOverloaded
              ? "The AI model is temporarily overloaded — please try again in a moment"
              : `Evaluation API failed (status ${response.status})`,
        },
        { status: isQuota ? 429 : isOverloaded ? 503 : 500 }
      );
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
                { error: "Failed to parse evaluation response — the AI returned malformed JSON" },
                { status: 502 }
              );
            }
          } else {
            console.error("JSON parse failed even after extraction:", innerErr, "\nExtracted:", extracted.slice(0, 500));
            return NextResponse.json(
              { error: "Failed to parse evaluation response — the AI returned malformed JSON" },
              { status: 502 }
            );
          }
        }
      } else {
        // Last resort: the response might be truncated before braces balance.
        // Try to repair by closing open braces/brackets.
        const repaired = repairTruncatedJson(content);
        if (repaired) {
          try {
            result = JSON.parse(repaired);
          } catch (repairErr) {
            console.error("JSON parse failed after truncation repair:", repairErr, "\nContent:", content.slice(0, 500));
            return NextResponse.json(
              { error: "Failed to parse evaluation response — the AI returned truncated JSON" },
              { status: 502 }
            );
          }
        } else {
          console.error("No JSON object found in Gemini response:", content.slice(0, 500));
          return NextResponse.json(
            { error: "Failed to parse evaluation response — no JSON found in AI output" },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Evaluation error:", err);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Network error — could not reach the evaluation API"
        : `Evaluation failed: ${err instanceof Error ? err.message : "unexpected error"}`;
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
