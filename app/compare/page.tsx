"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArticleList from "@/components/ArticleList";
import CompareTable from "@/components/CompareTable";
import FilterBar, { DEFAULT_FILTERS, type FilterState } from "@/components/FilterBar";
import { useArticles, useAllArticles, useOutlets } from "@/hooks/useArticles";

function ComparePageContent() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const { articles } = useArticles(filters);
  const allArticles = useAllArticles();
  const outlets = useOutlets();

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
    if (ids.length > 0) setSelectedIds(ids);
  }, [searchParams]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedArticles = allArticles.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">기사 비교</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          아래 목록에서 기사를 선택하면 나란히 비교할 수 있습니다.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            선택된 기사 ({selectedArticles.length}개)
          </h2>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              선택 초기화
            </button>
          )}
        </div>
        <CompareTable articles={selectedArticles} />
      </div>

      <hr className="border-gray-200" />

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">비교할 기사 선택</h2>
        <FilterBar filters={filters} onChange={setFilters} outlets={outlets} />
        <div className="mt-4">
          <ArticleList
            articles={articles}
            selectedIds={selectedIds}
            onToggleSelect={toggle}
          />
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400 text-sm">불러오는 중...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}
