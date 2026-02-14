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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Select a Case</h1>
        <p className="text-[#6B7280]">Choose a case to practice your framework skills</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === cat
                ? "bg-[#1B2A4A] text-white"
                : "bg-white text-[#1B2A4A] border border-gray-200 hover:border-[#1B2A4A]"
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
            className="group rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#00A651]/30 hover:shadow-md"
          >
            <div className="mb-3 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[c.category]}`}>
                {categoryLabels[c.category]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[c.difficulty]}`}>
                {c.difficulty}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-[#1B2A4A] group-hover:text-[#00A651] transition-colors">
              {c.title}
            </h3>
            <p className="line-clamp-2 text-sm text-[#6B7280]">{c.prompt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
