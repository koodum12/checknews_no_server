"use client";

export interface FilterState {
  keyword: string;
  outlet: string;
  dateFrom: string;
  dateTo: string;
  scoreMin: number;
  scoreMax: number;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  outlets?: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  keyword: "",
  outlet: "전체",
  dateFrom: "",
  dateTo: "",
  scoreMin: 0,
  scoreMax: 100,
};

export default function FilterBar({ filters, onChange, outlets = [] }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) =>
    onChange({ ...filters, ...partial });

  const outletOptions = ["전체", ...outlets];

  const hasActive =
    filters.keyword ||
    filters.outlet !== "전체" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.scoreMin !== 0 ||
    filters.scoreMax !== 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {/* 키워드 검색 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="키워드 검색..."
          value={filters.keyword}
          onChange={(e) => update({ keyword: e.target.value })}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* 언론사 */}
        <select
          value={filters.outlet}
          onChange={(e) => update({ outlet: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {outletOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {/* 날짜 범위 */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span className="self-center text-gray-400 text-sm">~</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        {/* 편향 점수 범위 */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-xs text-gray-500">편향</span>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.scoreMin}
            onChange={(e) => update({ scoreMin: Number(e.target.value) })}
            className="w-12 text-sm text-center focus:outline-none"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.scoreMax}
            onChange={(e) => update({ scoreMax: Number(e.target.value) })}
            className="w-12 text-sm text-center focus:outline-none"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>

        {/* 초기화 */}
        {hasActive && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
