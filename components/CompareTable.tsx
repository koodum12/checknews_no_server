"use client";

import type { Article } from "@/mocks/articles";
import BiasScoreCard from "./BiasScoreCard";

interface CompareTableProps {
  articles: Article[];
}

function getBiasLabel(score: number) {
  if (score >= 70) return { text: "고편향", cls: "bg-red-100 text-red-700" };
  if (score >= 40) return { text: "중편향", cls: "bg-amber-100 text-amber-700" };
  return { text: "저편향", cls: "bg-emerald-100 text-emerald-700" };
}

export default function CompareTable({ articles }: CompareTableProps) {
  if (articles.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
        <p className="text-sm">비교할 기사를 2개 이상 선택하세요.</p>
      </div>
    );
  }

  const rows: { label: string; render: (a: Article) => React.ReactNode }[] = [
    {
      label: "편향 점수",
      render: (a) => (
        <div className="flex justify-center">
          <BiasScoreCard score={a.biasScore} size="md" />
        </div>
      ),
    },
    {
      label: "언론사",
      render: (a) => (
        <span className="inline-block rounded px-2 py-0.5 text-sm font-medium text-blue-700 bg-blue-50">
          {a.outlet}
        </span>
      ),
    },
    {
      label: "날짜",
      render: (a) => <span className="text-sm text-gray-600">{a.date}</span>,
    },
    {
      label: "편향 수준",
      render: (a) => {
        const { text, cls } = getBiasLabel(a.biasScore);
        return (
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
            {text}
          </span>
        );
      },
    },
    {
      label: "근거 문장 수",
      render: (a) => (
        <span className="text-sm font-semibold text-gray-700">
          {a.highlightSentences.length}건
        </span>
      ),
    },
    {
      label: "요약",
      render: (a) => (
        <p className="text-sm text-gray-600 text-left leading-relaxed">{a.summary}</p>
      ),
    },
    {
      label: "주요 편향 근거",
      render: (a) =>
        a.highlightSentences.length === 0 ? (
          <span className="text-sm text-gray-400">해당 없음</span>
        ) : (
          <ul className="space-y-2 text-left">
            {a.highlightSentences.map((hs) => (
              <li key={hs.position} className="rounded-lg bg-amber-50 p-2">
                <p className="text-xs font-medium text-amber-800 line-clamp-2">"{hs.text}"</p>
                <p className="text-xs text-amber-600 mt-0.5">{hs.reason}</p>
              </li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="w-32 py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              항목
            </th>
            {articles.map((a) => (
              <th key={a.id} className="py-3 px-4 text-center">
                <p className="font-semibold text-gray-800 text-sm line-clamp-2">{a.title}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
            >
              <td className="py-3 px-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                {row.label}
              </td>
              {articles.map((a) => (
                <td key={a.id} className="py-3 px-4 text-center align-top">
                  {row.render(a)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
