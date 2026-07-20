"use client";

import { useState } from "react";
import type { HighlightSentence } from "@/mocks/articles";

interface HighlightViewerProps {
  fullText: string;
  highlightSentences: HighlightSentence[];
}

export default function HighlightViewer({ fullText, highlightSentences }: HighlightViewerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const renderText = () => {
    if (highlightSentences.length === 0) {
      return <p className="text-gray-700 leading-relaxed whitespace-pre-line">{fullText}</p>;
    }

    let remaining = fullText;
    const parts: React.ReactNode[] = [];
    let key = 0;

    for (const hs of highlightSentences) {
      const idx = remaining.indexOf(hs.text);
      if (idx === -1) continue;

      if (idx > 0) {
        parts.push(
          <span key={key++} className="text-gray-700">
            {remaining.slice(0, idx)}
          </span>
        );
      }

      const isActive = activeIndex === hs.position;
      parts.push(
        <button
          key={key++}
          onClick={() => setActiveIndex(isActive ? null : hs.position)}
          className={`relative inline cursor-pointer rounded px-0.5 transition-colors ${
            isActive
              ? "bg-amber-300 text-gray-900"
              : "bg-amber-100 text-gray-800 hover:bg-amber-200"
          }`}
        >
          {hs.text}
        </button>
      );

      remaining = remaining.slice(idx + hs.text.length);
    }

    if (remaining) {
      parts.push(
        <span key={key++} className="text-gray-700">
          {remaining}
        </span>
      );
    }

    return <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{parts}</p>;
  };

  const activeHs =
    activeIndex !== null
      ? highlightSentences.find((h) => h.position === activeIndex)
      : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        {renderText()}
      </div>

      {highlightSentences.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            편향 근거 문장 ({highlightSentences.length}건)
          </p>
          {highlightSentences.map((hs) => (
            <button
              key={hs.position}
              onClick={() => setActiveIndex(activeIndex === hs.position ? null : hs.position)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                activeIndex === hs.position
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              <p className="text-sm font-medium text-gray-800 line-clamp-2">"{hs.text}"</p>
              <p className="mt-1 text-xs text-gray-500">{hs.reason}</p>
            </button>
          ))}
        </div>
      )}

      {activeHs && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700">편향 판단 근거</p>
          <p className="mt-1 text-sm text-amber-800">{activeHs.reason}</p>
        </div>
      )}
    </div>
  );
}
