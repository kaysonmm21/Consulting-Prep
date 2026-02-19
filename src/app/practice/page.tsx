"use client";

import { useState } from "react";
import Link from "next/link";
import { cases } from "@/lib/cases";


const categories = ["all", "profitability", "market-entry", "ma", "pricing", "operations"] as const;
const categoryLabels: Record<string, string> = {
  all: "All",
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
const categoryColors: Record<string, string> = {
  profitability: "bg-blue-100 text-blue-700",
  "market-entry": "bg-purple-100 text-purple-700",
  ma: "bg-indigo-100 text-indigo-700",
  pricing: "bg-cyan-100 text-cyan-700",
  operations: "bg-orange-100 text-orange-700",
};

export default function PracticePage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? cases : cases.filter((c) => c.category === filter);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-4xl font-bold text-black sm:text-5xl">Select a Case</h1>
        <p className="mt-2 text-gray-500">Choose a case to practice your framework skills</p>
      </div>

      {/* Learn banner */}
      <Link
        href="/learn"
        className="rounded-lg bg-[#F1F1F1] p-4 flex items-center justify-between hover:bg-[#E8E8E8] transition-colors"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            New to cases?
          </p>
          <p className="text-sm font-bold text-black">
            Get Up to Speed on Case Frameworks
          </p>
        </div>
        <span className="text-xs font-semibold text-[#00A651]">
          Learn the basics →
        </span>
      </Link>

      {/* Filters */}
      <div className="flex flex-wrap gap-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
              filter === cat
                ? "text-black border-b-2 border-[#00A651] pb-0.5"
                : "text-gray-500 hover:text-black pb-0.5"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/practice/${c.id}`}
            className="group rounded-lg bg-[#F1F1F1] p-6 transition-all hover:bg-[#E8E8E8]"
          >
            <div className="mb-3 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[c.category]}`}>
                {categoryLabels[c.category]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[c.difficulty]}`}>
                {c.difficulty}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-black transition-colors">
              {c.title}
            </h3>
            <p className="line-clamp-2 text-sm text-gray-500">{c.prompt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
