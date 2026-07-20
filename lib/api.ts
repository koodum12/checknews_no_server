/**
 * API 레이어 (서버리스 버전)
 * - analyze / extract : Next.js Route Handler(/api/*) → OpenAI 서버사이드 호출
 * - articles(저장/목록/삭제) : 브라우저 localStorage 영속화 (별도 DB·서버 불필요)
 *
 * 함수 시그니처는 원본과 동일하게 유지 → 컴포넌트/훅 수정 불필요.
 */
import { MOCK_ARTICLES, MOCK_OUTLETS, type Article, type HighlightSentence } from "@/mocks/articles";
import { mockAnalyzeText } from "@/lib/mockAnalyze";
import type { FilterState } from "@/components/FilterBar";

const STORAGE_KEY = "checknews_articles";

// ── localStorage 기반 기사 저장소 ─────────────────────────────────
function loadStore(): Article[] {
  if (typeof window === "undefined") return [...MOCK_ARTICLES];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ARTICLES));
      return [...MOCK_ARTICLES];
    }
    const parsed = JSON.parse(raw) as Article[];
    return Array.isArray(parsed) ? parsed : [...MOCK_ARTICLES];
  } catch {
    return [...MOCK_ARTICLES];
  }
}

function saveStore(list: Article[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota 초과 등 무시 */
  }
}

// ── 기사 목록/조회/삭제/언론사 (localStorage) ─────────────────────
export async function fetchArticles(filters?: Partial<FilterState>): Promise<Article[]> {
  let list = loadStore();

  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(kw) ||
        a.fullText.toLowerCase().includes(kw)
    );
  }
  if (filters?.outlet && filters.outlet !== "전체") {
    list = list.filter((a) => a.outlet === filters.outlet);
  }
  if (filters?.dateFrom) {
    list = list.filter((a) => a.date >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    list = list.filter((a) => a.date <= filters.dateTo!);
  }
  if (filters?.scoreMin !== undefined) {
    list = list.filter((a) => a.biasScore >= filters.scoreMin!);
  }
  if (filters?.scoreMax !== undefined) {
    list = list.filter((a) => a.biasScore <= filters.scoreMax!);
  }

  return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function fetchArticleById(id: string): Promise<Article | undefined> {
  return loadStore().find((a) => a.id === id) ?? MOCK_ARTICLES.find((a) => a.id === id);
}

export async function fetchOutlets(): Promise<string[]> {
  const outlets = [...new Set(loadStore().map((a) => a.outlet).filter(Boolean))];
  return outlets.length > 0 ? outlets : MOCK_OUTLETS;
}

export async function deleteArticle(id: string): Promise<void> {
  const list = loadStore().filter((a) => a.id !== id);
  saveStore(list);
}

// ── URL 본문 추출 (서버리스 라우트) ───────────────────────────────
export interface ExtractResult {
  title: string;
  outlet: string;
  date: string;
  body: string;
  method: "crawler" | "gpt" | "failed";
}

export async function extractFromUrl(url: string): Promise<ExtractResult> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "본문 추출 실패" }));
    throw new Error((err as { detail?: string }).detail ?? "본문 추출 실패");
  }
  return res.json();
}

// ── 편향 분석 (서버리스 라우트 → 실패 시 클라이언트 mock) ─────────
export interface AnalyzePayload {
  body: string;
  url?: string;
  title?: string;
  outlet?: string;
  date?: string;
  section?: string;
  clean_body?: boolean;
}

export interface AnalyzeResult {
  bias_score: number;
  bias_level: string;
  summary: string;
  report: string;
  highlight_sentences: Array<{ text: string; reason: string; position: number }>;
  is_mock: boolean;
  used_llm: boolean;
  cleaned_body?: boolean;
}

export async function analyzeArticle(payload: AnalyzePayload): Promise<AnalyzeResult> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`분석 실패 (HTTP ${res.status})`);
    return res.json();
  } catch {
    return mockAnalyzeText(payload.body);
  }
}

// ── 기사 저장 (localStorage) ──────────────────────────────────────
export async function saveArticle(
  article: Omit<Article, "id"> & { biasLevel: string; reasoning: string }
): Promise<Article> {
  const list = loadStore();
  const existingIdx = list.findIndex((a) => a.url && a.url === article.url);

  const record: Article = {
    id: existingIdx >= 0 ? list[existingIdx].id : `saved-${Date.now()}`,
    url: article.url,
    title: article.title,
    outlet: article.outlet,
    date: article.date,
    biasScore: article.biasScore,
    summary: article.summary,
    reasoning: article.reasoning,
    highlightSentences: article.highlightSentences as HighlightSentence[],
    fullText: article.fullText,
    report: article.report || undefined,
  };

  if (existingIdx >= 0) list[existingIdx] = record;
  else list.unshift(record);
  saveStore(list);
  return record;
}

// ── 서버리스 함수 헬스체크 ────────────────────────────────────────
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
