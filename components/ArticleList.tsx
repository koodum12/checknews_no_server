"use client";

import Link from "next/link";
import type { Article } from "@/mocks/articles";
import BiasScoreCard from "./BiasScoreCard";

interface ArticleListProps {
  articles: Article[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function BiasBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function ArticleList({
  articles,
  selectedIds = [],
  onToggleSelect,
  onDelete,
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => {
        const isSelected = selectedIds.includes(article.id);
        return (
          <div
            key={article.id}
            className={`relative rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
              isSelected ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200"
            }`}
          >
            {/* 체크박스 (비교 선택) */}
            {onToggleSelect && (
              <button
                onClick={() => onToggleSelect(article.id)}
                className={`absolute right-10 top-4 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 bg-white hover:border-blue-400"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
            )}

            {/* 삭제 버튼 */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("이 기사를 삭제하시겠습니까?")) {
                    onDelete(article.id);
                  }
                }}
                className="absolute right-3 top-3.5 z-10 flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            <Link href={`/articles/${article.id}`} className="flex gap-4 p-4">
              <BiasScoreCard score={article.biasScore} size="sm" showLabel={false} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5">
                    {article.outlet}
                  </span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 pr-8">
                  {article.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.summary || article.reasoning}</p>

                <BiasBar score={article.biasScore} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">편향도</span>
                  <span className="text-xs font-medium text-gray-600">{article.biasScore}%</span>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
