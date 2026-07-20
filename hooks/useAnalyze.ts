"use client";

import { useState } from "react";
import type { HighlightSentence } from "@/mocks/articles";
import { analyzeArticle } from "@/lib/api";

interface AnalyzeResult {
  biasScore: number;
  biasLevel: string;
  summary: string;
  report: string;
  highlightSentences: HighlightSentence[];
  isMock: boolean;
  usedLlm: boolean;
  cleanedBody?: boolean;
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    text: string,
    meta?: { url?: string; title?: string; outlet?: string; date?: string; section?: string; clean_body?: boolean }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeArticle({ body: text, ...meta });
      setResult({
        biasScore: res.bias_score,
        biasLevel: res.bias_level,
        summary: res.summary,
        report: res.report,
        highlightSentences: res.highlight_sentences as HighlightSentence[],
        isMock: res.is_mock,
        usedLlm: res.used_llm,
        cleanedBody: res.cleaned_body,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, result, error };
}
