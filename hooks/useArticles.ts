"use client";

import { useState, useEffect, useCallback } from "react";
import { MOCK_ARTICLES, type Article } from "@/mocks/articles";
import type { FilterState } from "@/components/FilterBar";
import { fetchArticles, fetchArticleById, fetchOutlets, deleteArticle } from "@/lib/api";

export function useArticles(filters: FilterState) {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchArticles(filters)
      .then((data) => {
        if (!cancelled) {
          setAllArticles(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.keyword,
    filters.outlet,
    filters.dateFrom,
    filters.dateTo,
    filters.scoreMin,
    filters.scoreMax,
  ]);

  const remove = useCallback(async (id: string) => {
    await deleteArticle(id);
    setAllArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { articles: allArticles, total: allArticles.length, loading, remove };
}

export function useArticleById(id: string): Article | undefined {
  const [article, setArticle] = useState<Article | undefined>(
    MOCK_ARTICLES.find((a) => a.id === id)
  );
  useEffect(() => {
    fetchArticleById(id)
      .then((a) => { if (a) setArticle(a); })
      .catch(() => {});
  }, [id]);
  return article;
}

export function useCompareSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  return { selectedIds, toggle, clear };
}

export function useAllArticles(): Article[] {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  useEffect(() => {
    fetchArticles().then(setArticles).catch(() => {});
  }, []);
  return articles;
}

export function useOutlets(): string[] {
  const [outlets, setOutlets] = useState<string[]>([]);
  useEffect(() => {
    fetchOutlets().then(setOutlets).catch(() => {});
  }, []);
  return outlets;
}
