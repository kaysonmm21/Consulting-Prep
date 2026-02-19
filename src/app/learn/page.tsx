import Link from "next/link";
import { cases } from "@/lib/cases";

const DIMENSIONS = [
  {
    label: "MECE",
    fullName: "Mutually Exclusive, Collectively Exhaustive",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    what: "Each bucket covers a distinct, non-overlapping part of the problem. Taken together, all buckets fully cover the problem space with no major gaps.",
    howTo:
      "Before presenting, ask yourself: 'Do any two buckets overlap?' and 'Is any important area of the problem uncovered?' If yes to either, restructure.",
  },
  {
    label: "Case Fit",
    fullName: "Case Fit",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    what: "How tailored your framework is to the specific case prompt. A generic template applied to every case of the same type will score poorly here.",
    howTo:
      "Read the prompt carefully for unique details — industry, competitive context, the specific ask. Build at least one bucket using case-specific language, not just a standard template.",
  },
  {
    label: "Hypothesis & Prioritization",
    fullName: "Hypothesis & Prioritization",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-700",
    what: "Whether you state upfront where you believe the answer lies and which bucket you'd prioritize first — and why.",
    howTo:
      "After laying out your buckets say: 'My hypothesis is that the issue is on the cost side — specifically X — so I'd start with [Bucket Name].' Even if wrong, this signals business judgment.",
  },
  {
    label: "Depth",
    fullName: "Depth",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    what: "The quality and specificity of sub-points under each top-level bucket. Weak frameworks have no sub-points, or generic ones like 'analyze revenue.'",
    howTo:
      "Aim for 2–3 sub-points per bucket that are concrete and case-specific. Instead of 'revenue analysis', say 'price per unit vs. competitor rates' and 'volume by customer segment.'",
  },
  {
    label: "Clarifying Questions",
    fullName: "Clarifying Questions",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
    what: "What you chose to ask before building your framework — relevance, prioritization, and whether your questions would actually change your structure.",
    howTo:
      "Ask 2–4 questions before building. Focus on: what does success look like, what constraints exist, what data is available. Don't ask things you can infer from the prompt.",
  },
  {
    label: "Delivery",
    fullName: "Delivery",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    what: "How clearly and confidently you present your framework out loud — top-down structure, signposting language, and covering each bucket before sub-points.",
    howTo:
      "Always open with the count: 'I'd break this into three areas.' Name each bucket before its sub-points. Close with your hypothesis and where you'd start.",
  },
];

const RESOURCES = [
  {
    type: "YouTube",
    source: "YouTube",
    title: "Case Interview Frameworks — Full Walkthrough",
    description:
      "A complete walkthrough of how to build and present a strong case framework from scratch.",
    url: "https://www.youtube.com/watch?v=I1x0HvIO2d4&t=83s",
    cta: "Watch →",
  },
  {
    type: "YouTube",
    source: "IGotAnOffer",
    title: "Case Interview Framework — Step by Step",
    description:
      "End-to-end framework tutorial used by hundreds of thousands of candidates preparing for MBB interviews.",
    url: "https://www.youtube.com/watch?v=i9FDoJJT9sU",
    cta: "Watch →",
  },
  {
    type: "Article",
    source: "Case Interview Secret",
    title: "The Beginner's Guide to Case Interview Frameworks",
    description:
      "A structured text guide covering the full case interview process with annotated examples of good and weak frameworks.",
    url: "https://www.caseinterview.com/case_interview_frameworks.pdf",
    cta: "Read →",
  },
];

const categoryColors: Record<string, string> = {
  profitability: "bg-blue-100 text-blue-700",
  "market-entry": "bg-purple-100 text-purple-700",
  ma: "bg-indigo-100 text-indigo-700",
  pricing: "bg-cyan-100 text-cyan-700",
  operations: "bg-orange-100 text-orange-700",
};

const categoryLabels: Record<string, string> = {
  profitability: "Profitability",
  "market-entry": "Market Entry",
  ma: "M&A",
  pricing: "Pricing",
  operations: "Operations",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function LearnPage() {
  const exampleCase = cases.find((c) => c.id === "ops-ecommerce")!;

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Section 1: Header */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#00A651]">
          Framework Primer
        </p>
        <h1 className="text-4xl font-bold text-black sm:text-5xl">
          Get Up to Speed on Case Frameworks
        </h1>
        <p className="max-w-2xl text-gray-500">
          Everything you need to know before your first case — what a framework
          is, what a great one looks like, and exactly how your work will be
          scored.
        </p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
        >
          Start Practicing →
        </Link>
      </div>

      {/* Section 2: What Is a Framework? */}
      <div className="rounded-xl bg-[#F1F1F1] p-6 sm:p-8">
        <h2 className="mb-4 text-2xl font-bold text-black">
          What Is a Framework?
        </h2>
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-gray-600">
          <p>
            A framework is a structured breakdown of the problem into 2–5
            top-level buckets, each with sub-points, that you present verbally
            before diving into analysis.
          </p>
          <p>
            Interviewers evaluate how you think, not just whether you reach the
            right answer. A structured framework signals logical rigor, business
            intuition, and communication skill.
          </p>
          <p>
            <strong className="text-black">Format:</strong> Think of it as an
            outline. State your top-level categories first (&lsquo;I&rsquo;d break this
            into three areas: X, Y, and Z&rsquo;), then walk through what you&rsquo;d
            explore under each one.
          </p>
        </div>
      </div>

      {/* Section 3: What Good Looks Like */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
            Example
          </p>
          <h2 className="text-2xl font-bold text-black">What Good Looks Like</h2>
        </div>

        {/* Case Prompt */}
        <div className="rounded-xl bg-[#F1F1F1] p-6">
          <div className="mb-4 h-1.5 rounded-full bg-[#00A651]" />
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[exampleCase.category]}`}
            >
              {categoryLabels[exampleCase.category]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[exampleCase.difficulty]}`}
            >
              {exampleCase.difficulty}
            </span>
          </div>
          <h3 className="mb-3 text-lg font-bold text-black">{exampleCase.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{exampleCase.prompt}</p>
          <p className="mt-4 text-xs italic text-gray-400">
            In a real session, you&rsquo;d read this, ask clarifying questions, then
            have 2 minutes to build your framework.
          </p>
        </div>

        {/* Example Framework — horizontal slide layout */}
        <div className="rounded-xl border border-[#00A651]/20 bg-white p-6 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
            Example Framework Response
          </p>

          {/* Horizontal bucket columns */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <div className="flex min-w-max">
              {exampleCase.exampleFramework.buckets.map((bucket, i) => (
                <div
                  key={bucket.name}
                  className={`flex min-w-[180px] flex-1 flex-col ${
                    i < exampleCase.exampleFramework.buckets.length - 1
                      ? "border-r border-gray-200"
                      : ""
                  }`}
                >
                  {/* Column header */}
                  <div className="bg-gray-800 px-4 py-3">
                    <p className="text-sm font-bold text-white">{bucket.name}</p>
                  </div>
                  {/* Sub-points */}
                  <div className="flex-1 bg-[#F8F8F8] p-4">
                    <ul className="space-y-2">
                      {bucket.subPoints.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <span className="mt-0.5 shrink-0 text-[#00A651]">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why this works */}
          <div className="mt-4 rounded-lg border border-[#00A651]/20 bg-green-50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#00A651]">
              Why this works
            </p>
            <p className="text-xs leading-relaxed text-gray-600">
              {exampleCase.exampleFramework.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: The 6 Scored Dimensions */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
            Scoring Rubric
          </p>
          <h2 className="text-2xl font-bold text-black">
            How Your Framework Is Scored
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Every framework you submit is evaluated across six dimensions. Here
            is what each one measures and how to perform well on it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DIMENSIONS.map((dim) => (
            <div
              key={dim.label}
              className={`rounded-xl border p-5 ${dim.bgColor} ${dim.borderColor}`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dim.bgColor} ${dim.textColor} border ${dim.borderColor}`}
                >
                  {dim.label}
                </span>
                {dim.fullName !== dim.label && (
                  <span className="text-xs text-gray-500">{dim.fullName}</span>
                )}
              </div>
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  What it measures
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {dim.what}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  How to do it well
                </p>
                <p className="text-xs leading-relaxed text-gray-600">
                  {dim.howTo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Resources */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
            Recommended Resources
          </p>
          <h2 className="text-2xl font-bold text-black">Go Deeper</h2>
          <p className="mt-2 text-sm text-gray-500">
            These are the resources experienced case coaches most recommend.
            None are affiliated with CaseCoach — just genuinely useful.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RESOURCES.map((resource) => (
            <a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-xl bg-[#F1F1F1] p-5 transition-colors hover:bg-[#E8E8E8]"
            >
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                  resource.type === "YouTube"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {resource.type}
              </span>
              <p className="text-xs text-gray-500">{resource.source}</p>
              <p className="text-sm font-bold text-black transition-colors group-hover:text-[#00A651]">
                {resource.title}
              </p>
              <p className="text-xs text-gray-500">{resource.description}</p>
              <p className="mt-auto text-xs font-semibold text-[#00A651]">
                {resource.cta}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Section 6: CTA Footer */}
      <div className="rounded-xl bg-[#F1F1F1] p-8 text-center sm:p-12">
        <h2 className="mb-3 text-2xl font-bold text-black sm:text-3xl">
          Ready to Practice?
        </h2>
        <p className="mb-6 text-gray-500">
          You&rsquo;ve got the theory. Now put it to work on a real case.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Pick a Case →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border-2 border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
