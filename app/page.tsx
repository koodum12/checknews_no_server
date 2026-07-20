import Link from "next/link";
import { fetchArticles } from "@/lib/api";
import BiasScoreCard from "@/components/BiasScoreCard";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default async function HomePage() {
  const articles = await fetchArticles();
  const total = articles.length;
  const avgScore = total > 0
    ? Math.round(articles.reduce((s, a) => s + a.biasScore, 0) / total)
    : 0;
  const highBias = articles.filter((a) => a.biasScore >= 70).length;
  const recentArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">뉴스 편향 분석 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          한국어 뉴스의 편향 어투를 분석하여 균형 잡힌 정보 소비를 돕습니다.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="분석 기사 수" value={`${total}건`} sub="저장된 전체" />
        <StatCard label="평균 편향 점수" value={`${avgScore}%`} sub="전체 기사 기준" />
        <StatCard label="고편향 기사" value={`${highBias}건`} sub="70% 이상" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">최근 분석 기사</h2>
          <Link href="/articles" className="text-sm text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>

        <div className="space-y-3">
          {recentArticles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <BiasScoreCard score={article.biasScore} size="sm" showLabel={false} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5">
                    {article.outlet}
                  </span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{article.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
              </div>
              <span
                className={`shrink-0 text-sm font-bold ${
                  article.biasScore >= 70
                    ? "text-red-600"
                    : article.biasScore >= 40
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {article.biasScore}%
              </span>
            </Link>
          ))}
          {recentArticles.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              아직 분석된 기사가 없습니다. 크롬 확장프로그램으로 기사를 분석해보세요.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">편향 점수 분포</h2>
        {total === 0 ? (
          <p className="text-sm text-gray-400">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {[
              { label: "저편향 (0~39%)", count: articles.filter((a) => a.biasScore < 40).length, color: "bg-emerald-400" },
              { label: "중편향 (40~69%)", count: articles.filter((a) => a.biasScore >= 40 && a.biasScore < 70).length, color: "bg-amber-400" },
              { label: "고편향 (70~100%)", count: articles.filter((a) => a.biasScore >= 70).length, color: "bg-red-500" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-32 text-xs text-gray-500 shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/articles"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">아카이브 보기</p>
            <p className="text-xs text-gray-400">저장된 분석 결과 검색·필터</p>
          </div>
        </Link>
        <Link
          href="/compare"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">기사 비교</p>
            <p className="text-xs text-gray-400">여러 기사를 나란히 비교</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
