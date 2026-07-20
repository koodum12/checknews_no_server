"use client";

import { useState } from "react";
import BiasScoreCard from "@/components/BiasScoreCard";
import HighlightViewer from "@/components/HighlightViewer";
import { useAnalyze } from "@/hooks/useAnalyze";
import { extractFromUrl, saveArticle } from "@/lib/api";
import type { HighlightSentence } from "@/mocks/articles";

type ExtractState = "idle" | "loading" | "done" | "error";

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [outlet, setOutlet] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const [cleanBody, setCleanBody] = useState(false);

  const [extractState, setExtractState] = useState<ExtractState>("idle");
  const [extractMethod, setExtractMethod] = useState<string>("");
  const [extractError, setExtractError] = useState("");

  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { analyze, loading, result, error } = useAnalyze();

  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtractState("loading");
    setExtractError("");
    setBody("");
    setTitle("");
    setOutlet("");
    setDate("");

    try {
      const data = await extractFromUrl(url.trim());
      setBody(data.body);
      setTitle(data.title);
      setOutlet(data.outlet);
      setDate(data.date);
      setExtractMethod(data.method);
      setExtractState("done");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "본문 추출 실패");
      setExtractState("error");
    }
  };

  const handleAnalyze = () => {
    if (!body.trim()) return;
    setSavedId(null);
    analyze(body.trim(), { url, title, outlet, date, clean_body: cleanBody });
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const saved = await saveArticle({
        url: url || `manual-${Date.now()}`,
        title: title || "제목 없음",
        outlet: outlet || "",
        date: date || new Date().toISOString().slice(0, 10),
        biasScore: result.biasScore,
        biasLevel: result.biasLevel,
        summary: result.summary,
        reasoning: result.report,
        highlightSentences: result.highlightSentences as HighlightSentence[],
        fullText: body,
        report: result.report,
      });
      setSavedId(saved.id);
    } catch {
      alert("저장에 실패했습니다. 서버 연결을 확인해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">기사 편향 분석</h1>
        <p className="mt-1 text-sm text-gray-500">
          URL을 입력하면 본문을 자동으로 추출합니다. 직접 붙여넣기도 가능합니다.
        </p>
      </div>

      {/* ── URL 입력 ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">기사 URL</h2>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://n.news.naver.com/... 또는 기타 뉴스 URL"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setExtractState("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={handleExtract}
            disabled={!url.trim() || extractState === "loading"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {extractState === "loading" ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                추출 중…
              </span>
            ) : "본문 추출"}
          </button>
        </div>

        {/* 추출 상태 */}
        {extractState === "done" && (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            본문 추출 완료
            <span className={`rounded px-1.5 py-0.5 font-medium ${
              extractMethod === "gpt"
                ? "bg-purple-100 text-purple-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {extractMethod === "gpt" ? "GPT-4o-mini" : "크롤러"}
            </span>
          </div>
        )}
        {extractState === "error" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <span className="font-semibold">추출 실패:</span> {extractError}
            <br />
            아래 텍스트 박스에 본문을 직접 붙여넣어 주세요.
          </div>
        )}
      </div>

      {/* ── 본문 (자동 채움 + 직접 입력 가능) ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            기사 본문
            {extractState === "idle" && !body && (
              <span className="ml-2 text-xs font-normal text-gray-400">(URL 추출 또는 직접 붙여넣기)</span>
            )}
          </h2>
          {body && (
            <button
              onClick={() => { setBody(""); setExtractState("idle"); setExtractMethod(""); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              지우기
            </button>
          )}
        </div>

        {/* 메타 정보 (추출 시 자동 채움, 수정 가능) */}
        {(title || outlet || date) && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-300 focus:outline-none"
            />
            <input
              type="text"
              placeholder="언론사"
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-300 focus:outline-none"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-300 focus:outline-none"
            />
          </div>
        )}

        <textarea
          rows={10}
          placeholder="URL로 자동 추출하거나, 기사 본문을 직접 붙여넣으세요…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{body.length}자</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cleanBody}
                onChange={(e) => setCleanBody(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-600"
              />
              <span className="text-xs text-gray-500">GPT 본문 정제</span>
              <span className="text-xs text-gray-400">(광고·기자정보 추가 제거)</span>
            </label>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!body.trim() || loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "분석 중…" : "편향 분석하기"}
          </button>
        </div>
      </div>

      {/* 오류 */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── 분석 결과 ── */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-5">
              <BiasScoreCard score={result.biasScore} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {result.isMock && (
                    <span className="text-xs rounded px-2 py-0.5 bg-gray-100 text-gray-500 font-medium">
                      Mock 모드
                    </span>
                  )}
                  {result.usedLlm && (
                    <span className="text-xs rounded px-2 py-0.5 bg-purple-100 text-purple-600 font-medium">
                      GPT-4o 분석
                    </span>
                  )}
                  {result.cleanedBody && (
                    <span className="text-xs rounded px-2 py-0.5 bg-emerald-100 text-emerald-700 font-medium">
                      본문 정제됨
                    </span>
                  )}
                </div>

                {result.summary && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">요약</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">편향 판단 근거</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.report}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 근거 하이라이트 */}
          {result.highlightSentences.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">본문 및 편향 근거</h2>
              <HighlightViewer
                fullText={body}
                highlightSentences={result.highlightSentences as HighlightSentence[]}
              />
            </div>
          )}

          {/* 저장 */}
          <div className="flex justify-end gap-3">
            {savedId ? (
              <span className="text-sm text-emerald-600 font-medium self-center">
                ✓ 대시보드에 저장되었습니다
              </span>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                {saving ? "저장 중…" : "대시보드에 저장"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
