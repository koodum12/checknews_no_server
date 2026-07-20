"use client";

import { useState } from "react";
import Link from "next/link";
import FilterBar, { DEFAULT_FILTERS, type FilterState } from "@/components/FilterBar";
import ArticleList from "@/components/ArticleList";
import { useArticles, useCompareSelection, useOutlets } from "@/hooks/useArticles";

export default function ArticlesPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const { articles, total, remove, loading } = useArticles(filters);
  const { selectedIds, toggle, clear } = useCompareSelection();
  const outlets = useOutlets();

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
    } catch {
      alert("삭제에 실패했습니다. 서버 연결을 확인해주세요.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">아카이브</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-gray-500">
              {articles.length}건 표시 / 전체 {total}건
            </p>
          )}
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} outlets={outlets} />

      {/* 비교 선택 배너 */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-white shadow">
          <span className="text-sm font-medium">
            {selectedIds.length}개 기사 선택됨
          </span>
          <div className="flex gap-2">
            <button
              onClick={clear}
              className="rounded-lg border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
            >
              선택 해제
            </button>
            <Link
              href={`/compare?ids=${selectedIds.join(",")}`}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              비교 보기 →
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-1.5 bg-gray-100 rounded-full w-full mt-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ArticleList
          articles={articles}
          selectedIds={selectedIds}
          onToggleSelect={toggle}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
