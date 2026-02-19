import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "No AI API key configured" }, { status: 500 });
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
      clarifyingQuestionsAsked,
      totalClarifyingQuestions,
      previousAttempt,
    } = body;

    const prompt = `You are an expert consulting interview evaluator from McKinsey, BCG, or Bain. Your feedback is direct, calibrated, and specific to the candidate's actual words. You never give vague or generic feedback.

## Output Style Contract

Follow these rules exactly. They apply to every text field in the JSON output.

REQUIRED:
- Every dimension comment: exactly 1 sentence describing what the candidate did, + exactly 1 sentence giving a concrete action. 2 sentences total. No exceptions.
- Every suggestion title: 1 imperative sentence naming the specific bucket or sub-point. Start with "Add", "Remove", "Rename", "Split", or "Specify" — never "Consider" or "Try to".
- Every suggestion detail: 2-3 sentences: (1) why it matters in a real case interview, (2) how to implement it with example phrasing the candidate could use.
- topStrength: 1 sentence naming the specific thing done well, referencing the candidate's actual words or structure.
- topImprovement: 1 sentence naming the specific gap, not a category.

NEVER write:
- "Great job!", "Well done!", or any evaluative opener before substance
- "Overall, ..." as a sentence starter
- "You should consider ..." or "Try to ..." (use direct imperatives instead)
- More than 2 sentences in any dimension comment
- Generic phrases like "good structure", "solid framework", "nice work" without a specific referent from the transcript
- Filler words as sentence openers: "Also,", "Additionally,", "Furthermore,", "In conclusion,"

## Original Case Prompt
${casePrompt}

## Candidate's Framework Presentation (Transcribed from audio)
${transcript}

## Session Metadata
- Time spent building framework: ${frameworkTime} seconds
- Time spent presenting: ${presentationTime} seconds
- Showed case transcript (instead of just listening): ${showedTranscript}
- Clarifying questions asked: ${clarifyingQuestionsAsked?.length || clarifyingQuestionsViewed?.length || 0} out of ${totalClarifyingQuestions} available
${clarifyingQuestionsAsked?.length ? `\n## Clarifying Questions Asked by Candidate\n${clarifyingQuestionsAsked.map((q: { question: string; answer: string }, i: number) => `Q${i + 1}: ${q.question}\nInterviewer response: ${q.answer}`).join("\n\n")}` : ""}

## Scoring Rubric

Score each dimension 1–5 using the behavioral anchors below. A score of 3 is the default for a competent but unremarkable response. Reserve 4 for a clear strength and 5 for something that would impress a partner. Do not inflate scores — most candidates score between 2 and 4.

**1. MECE** — Mutual exclusivity and collective exhaustivity of framework buckets.
- 1: Major overlap between buckets, OR obvious areas of the case are completely missing
- 2: Some overlap between buckets, OR 1-2 relevant areas missing
- 3: Buckets are mostly non-overlapping; covers main areas but not comprehensively
- 4: Clearly non-overlapping buckets; covers all key areas with only minor gaps
- 5: Perfectly structured — a McKinsey partner would not add or remove a bucket

**2. Case Fit** — How tailored the framework is to this specific case vs. a generic memorized structure.
- 1: Framework is a generic template (e.g., "Revenue / Costs / Other") with no case-specific language
- 2: Has some case-specific language but could apply to most cases in this category
- 3: Framework reflects the case context; 1-2 buckets are clearly tailored to the specific situation
- 4: Framework is visibly built for this case; uses client/industry-specific language throughout
- 5: Framework could only make sense for this exact case; shows creative insight about the unique challenge

**3. Hypothesis & Prioritization** — Whether the candidate states a hypothesis and flags where to start.
- 1: No hypothesis stated and no indication of where to start
- 2: Weak signal ("I think costs might be important") but no explicit prioritization
- 3: States a hypothesis or indicates one area to prioritize, with minimal reasoning
- 4: States a clear hypothesis tied to the case context and explains why they would start there
- 5: Crisp hypothesis reflecting case-specific insight, with a logical prioritization order for all buckets

**4. Depth** — Quality and specificity of sub-points under each bucket.
- 1: No sub-points, or sub-points are synonyms of the bucket name
- 2: Sub-points exist but are generic (e.g., "analyze costs" under a cost bucket)
- 3: Sub-points are reasonable and specific, though some are still generic
- 4: Sub-points are actionable questions or areas; a team could begin analysis with this framework
- 5: Sub-points reflect nuanced understanding of the case; each one points to a specific analytical workstream

**5. Clarifying Questions** — Quality and relevance of questions asked before building the framework.
- Scoring is relative: ${totalClarifyingQuestions} questions were available; candidate asked ${clarifyingQuestionsAsked?.length || 0}.
- 1: Asked 0 questions when questions were clearly relevant, OR asked completely off-topic questions
- 2: Asked 1 marginally relevant question, or missed the most critical questions
- 3: Asked questions that were relevant but not the most insightful ones for this case type
- 4: Asked 2-3 high-quality questions that would materially affect the framework structure
- 5: Asked exactly the right questions to clarify scope, constraints, or key unknowns — interview-ready

**6. Delivery** — Top-down structure, signposting, and clarity of the presentation.
- 1: No signposting; presentation order is hard to follow; presenter seems to be working it out in real time
- 2: Some structure visible but inconsistent; ran through buckets without clear transitions
- 3: Clearly announced buckets; mostly top-down; minor awkwardness in transitions
- 4: Strong top-down delivery with explicit signposting; professional pacing
- 5: Would require no coaching on delivery in a real interview — confident, structured, and well-paced

**Overall Score** — Set to the exact average of the 6 dimension scores, rounded to 1 decimal place.

## Improvement Suggestions

Provide exactly 5 suggestions. Each must be a specific change to THIS candidate's framework — not generic advice and not a whole new framework.

Use this checklist to ensure dimensional coverage (do not give 2 suggestions on the same theme):
- At least 1 suggestion about MECE (add, remove, split, or merge a bucket)
- At least 1 suggestion about case specificity (rename something generic to something case-specific)
- At least 1 suggestion about depth (add or improve sub-points under a named bucket)
- Remaining 2 suggestions: any dimension where you saw a clear gap

Each suggestion:
- "title": 1 imperative sentence. Name the bucket or sub-point explicitly. Start with "Add", "Remove", "Rename", "Split", or "Specify".
- "detail": 2-3 sentences: (1) what this improves and why it matters in a case interview, (2) specific phrasing the candidate could use.

Keep depth appropriate — candidates only have 2-3 minutes. A good framework has 3-4 buckets with 2-3 sub-points each.

## Calibration Example

The example below shows the CORRECT output quality and style. Match this level of specificity and sentence structure exactly. Do NOT use these scores for the actual candidate — this is for calibration only.

Context: SaaS company with flat-fee pricing, growth stalled. Candidate said: "My framework has three buckets: Revenue — pricing model and customer segments; Costs — our cost structure; Strategy — what we should do." Candidate asked 0 of 5 available questions.

{"scores":{"overall":2.2,"mece":2,"caseFit":1,"hypothesisAndPrioritization":1,"depth":2,"clarifyingQuestions":1,"delivery":3},"feedback":{"meceComment":"Your 'Strategy' bucket overlaps with both Revenue and Costs since any strategic recommendation would draw from both analyses. Rename it to 'Transition Plan' and scope it specifically to customer migration, rollout timeline, and communication.","caseFitComment":"All three bucket names — Revenue, Costs, Strategy — could describe any business without changing a single word. Rename Revenue to 'Pricing Model Analysis' and add a bucket called 'Customer Segment Economics' to reflect the core pricing problem in this case.","hypothesisAndPrioritizationComment":"No hypothesis was stated and no area was identified as the starting point before listing buckets. Open with: 'My hypothesis is that flat-fee pricing is undercharging large customers and pricing out small ones, so I'd start with segment-level unit economics.'","depthComment":"Each bucket has at most one sub-point and none are actionable analysis questions. Under Revenue, add: revenue per customer by company size, churn rate by segment, and willingness-to-pay data — these turn a vague bucket into a real workstream.","clarifyingQuestionsComment":"You asked no questions despite five being available, missing critical unknowns like churn rate and competitive pricing that would directly shape your framework. Ask at least two targeted questions before building any pricing framework.","deliveryComment":"You signposted all three buckets clearly and moved top-down throughout the presentation. Add a one-sentence synthesis at the end to tie the buckets together before diving in.","suggestions":[{"title":"Add a fourth bucket called 'Customer Segment Economics' to address the core pricing problem.","detail":"The case is specifically about whether different customer segments should pay different amounts, but your framework has no bucket dedicated to analyzing those segments. This directly raises your Case Fit score — say: 'My third bucket is Customer Segment Economics: revenue per seat by company size, cost-to-serve by segment, and churn drivers by segment.'"},{"title":"Rename 'Strategy' to 'Transition Plan' and scope it to customer migration only.","detail":"The current name overlaps with everything else in your framework since all analysis leads to strategy. Scoping it to the transition — grandfathering policy, rollout timeline, and communication — makes it MECE; say: 'My final bucket is the transition plan: how do we move existing customers without losing them?'"},{"title":"Add three sub-points under Revenue: revenue by segment, churn by segment, and price sensitivity.","detail":"Right now Revenue only has 'pricing model' as a sub-point, which is too vague to drive real analysis. Each sub-point should be a question your team can go answer with data — these three turn a vague label into a concrete workstream and raise your Depth score."},{"title":"State your hypothesis in the first sentence before listing any buckets.","detail":"You went straight to listing buckets without telling the interviewer where you think the answer lies. Open with: 'My hypothesis is that the flat fee is creating two problems — it's too expensive for small teams and too cheap for large ones — so I'll structure my analysis around diagnosing and solving both.'"},{"title":"Ask about churn rate and competitive pricing before building your framework.","detail":"The case says growth is stalled but doesn't say why — a 3% monthly churn rate versus 0.5% would lead to completely different frameworks. These two questions take 30 seconds and would materially change your structure; skipping them signals you build frameworks before you understand the problem."}],"topStrength":"Your delivery was clear and professional — you signposted all three buckets upfront and moved through them in a logical order.","topImprovement":"Your framework has no case-specific language — every bucket name and sub-point could describe a generic business problem rather than a pricing model redesign for a SaaS company."}}

${previousAttempt ? `
## Retry Attempt — Previous Session Context

This is the candidate's second attempt on the same case. Their previous overall score was ${previousAttempt.scores.overall}/5.

Previous top strength: "${previousAttempt.feedback.topStrength}"
Previous top improvement: "${previousAttempt.feedback.topImprovement}"
Suggestions they received last time:
${previousAttempt.feedback.suggestions.map((s: { title: string }, i: number) => `${i + 1}. ${s.title}`).join("\n")}

Scoring instructions for this retry:
- Score this attempt fully on its own merits — do not inflate scores because it is a second attempt.
- Where the candidate has clearly addressed a previous suggestion, note the improvement explicitly in that dimension's comment: "Compared to your first attempt, [specific observation]."
- Where they ignored a key piece of feedback or regressed on a previous strength, name it directly.
- Your topStrength and topImprovement must reflect what is true of this attempt specifically — do not copy from the previous session.
- Do not give the same feedback twice. This is a new recording, a new evaluation.
` : ""}
Respond in this EXACT JSON format (no markdown, no code fences, just raw JSON):
{
  "scores": {
    "overall": 0,
    "mece": 0,
    "caseFit": 0,
    "hypothesisAndPrioritization": 0,
    "depth": 0,
    "clarifyingQuestions": 0,
    "delivery": 0
  },
  "feedback": {
    "meceComment": "",
    "caseFitComment": "",
    "hypothesisAndPrioritizationComment": "",
    "depthComment": "",
    "clarifyingQuestionsComment": "",
    "deliveryComment": "",
    "suggestions": [{"title": "", "detail": ""}, {"title": "", "detail": ""}, {"title": "", "detail": ""}, {"title": "", "detail": ""}, {"title": "", "detail": ""}],
    "topStrength": "",
    "topImprovement": ""
  }
}`;

    let content = "";

    const groqSystemMsg = "You are an expert consulting interview evaluator. Always respond with valid JSON only — no markdown, no code fences.";

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
          max_tokens: 4096,
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
            generationConfig: { temperature, maxOutputTokens: 4096, responseMimeType: "application/json" },
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
