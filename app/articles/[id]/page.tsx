import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchArticleById } from "@/lib/api";
import BiasScoreCard from "@/components/BiasScoreCard";
import HighlightViewer from "@/components/HighlightViewer";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await fetchArticleById(id);
  if (!article) notFound();

  const biasLevel =
    article.biasScore >= 70 ? "고편향" : article.biasScore >= 40 ? "중편향" : "저편향";
  const biasColor =
    article.biasScore >= 70
      ? "text-red-600 bg-red-50 border-red-200"
      : article.biasScore >= 40
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        아카이브로 돌아가기
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <BiasScoreCard score={article.biasScore} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded px-2 py-0.5 border border-blue-100">
                {article.outlet}
              </span>
              <span className="text-xs text-gray-400">{article.date}</span>
              <span className={`text-xs font-semibold rounded px-2 py-0.5 border ${biasColor}`}>
                {biasLevel}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{article.title}</h1>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
            >
              원문 보기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">기사 요약</h2>
        {article.summary ? (
          <p className="text-sm text-gray-600 leading-relaxed">{article.summary}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">LLM 분석이 수행되지 않아 요약이 없습니다.</p>
        )}
      </div>

      {article.reasoning && !article.report && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">편향 판단 근거</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{article.reasoning}</p>
        </div>
      )}

      {article.report && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="text-sm font-semibold text-purple-800">AI 분석 리포트</h2>
          </div>
          <p className="text-sm text-purple-700 leading-relaxed">{article.report}</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">본문 및 편향 근거</h2>
        <HighlightViewer
          fullText={article.fullText}
          highlightSentences={article.highlightSentences}
        />
      </div>

      <div className="flex justify-end">
        <Link
          href={`/compare?ids=${article.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
          </svg>
          다른 기사와 비교
        </Link>
      </div>
    </div>
  );
}
