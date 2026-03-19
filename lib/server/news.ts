import { NewsFeed } from "@/lib/types";

const NEWS_API_BASE = "https://cryptocurrency.cv";

type NewsApiArticle = {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: string;
  sourceKey?: string;
  category?: string;
  timeAgo?: string;
  tickers?: string[];
  sentiment?: string;
  relevance?: number;
};

type NewsApiResponse = {
  articles?: NewsApiArticle[];
  fetchedAt?: string;
  totalCount?: number;
  total?: number;
  sources?: string[];
};

function normalizeArticles(payload: NewsApiResponse) {
  return (payload.articles ?? [])
    .filter((article) => article.title && article.link)
    .map((article) => ({
      title: article.title ?? "Untitled",
      link: article.link ?? "#",
      description: article.description ?? "",
      pubDate: article.pubDate ?? new Date().toISOString(),
      source: article.source ?? "Unknown source",
      sourceKey: article.sourceKey,
      category: article.category,
      timeAgo: article.timeAgo,
      tickers: article.tickers ?? [],
      sentiment: article.sentiment,
      relevance: article.relevance,
    }));
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`News lookup failed with status ${response.status}`);
  }

  return (await response.json()) as NewsApiResponse;
}

export async function loadNewsFeed(input: {
  category?: string;
  query?: string;
  limit?: number;
}): Promise<NewsFeed> {
  const category = input.category?.trim() || "solana";
  const query = input.query?.trim() || "";
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);

  if (query) {
    const payload = await fetchJson(
      `${NEWS_API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    );

    return {
      mode: "search",
      query,
      fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      totalCount: payload.total ?? payload.totalCount,
      articles: normalizeArticles(payload),
      sources: payload.sources ?? [],
    };
  }

  const payload = await fetchJson(
    `${NEWS_API_BASE}/api/news?category=${encodeURIComponent(category)}&limit=${limit}`,
  );

  return {
    mode: "category",
    category,
    fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
    totalCount: payload.totalCount ?? payload.total,
    articles: normalizeArticles(payload),
    sources: payload.sources ?? [],
  };
}
