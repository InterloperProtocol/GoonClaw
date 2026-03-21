import { XMLParser } from "fast-xml-parser";

import { NewsArticle, NewsFeed } from "@/lib/types";

const NEWS_API_BASE = "https://cryptocurrency.cv";

type NewsCategoryId = "solana" | "onchain" | "trading" | "macro";
type SourceParser = "rss" | "coinmarketcap";

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

type NewsSource = {
  id: string;
  label: string;
  url: string;
  website: string;
  parser: SourceParser;
  categories: NewsCategoryId[];
};

type CoinMarketCapArticle = {
  meta?: {
    title?: string;
    subtitle?: string;
    sourceName?: string;
    sourceUrl?: string;
    releasedAt?: string;
  };
};

const NEWS_SOURCE_CATALOG: NewsSource[] = [
  {
    id: "coindesk",
    label: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    website: "https://www.coindesk.com/tag/cryptocurrency",
    parser: "rss",
    categories: ["solana", "trading", "macro"],
  },
  {
    id: "the-block",
    label: "The Block",
    url: "https://www.theblock.co/rss.xml",
    website: "https://www.theblock.co",
    parser: "rss",
    categories: ["solana", "trading", "macro"],
  },
  {
    id: "decrypt",
    label: "Decrypt",
    url: "https://decrypt.co/feed",
    website: "https://decrypt.co/news",
    parser: "rss",
    categories: ["solana", "trading"],
  },
  {
    id: "messari",
    label: "Messari",
    url: "https://messari.io/rss",
    website: "https://messari.io/news",
    parser: "rss",
    categories: ["solana", "onchain"],
  },
  {
    id: "cointelegraph",
    label: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    website: "https://cointelegraph.com",
    parser: "rss",
    categories: ["solana", "trading"],
  },
  {
    id: "bitcoin-magazine",
    label: "Bitcoin Magazine",
    url: "https://bitcoinmagazine.com/feed",
    website: "https://bitcoinmagazine.com",
    parser: "rss",
    categories: ["solana", "macro"],
  },
  {
    id: "the-defiant",
    label: "The Defiant",
    url: "https://thedefiant.io/api/feed",
    website: "https://thedefiant.io",
    parser: "rss",
    categories: ["solana", "onchain"],
  },
  {
    id: "chainalysis",
    label: "Chainalysis",
    url: "https://www.chainalysis.com/blog/feed",
    website: "https://www.chainalysis.com/blog",
    parser: "rss",
    categories: ["onchain", "macro"],
  },
  {
    id: "glassnode",
    label: "Glassnode",
    url: "https://insights.glassnode.com/rss",
    website: "https://insights.glassnode.com",
    parser: "rss",
    categories: ["onchain", "trading"],
  },
  {
    id: "elliptic",
    label: "Elliptic",
    url: "https://www.elliptic.co/blog/rss.xml",
    website: "https://www.elliptic.co/blog",
    parser: "rss",
    categories: ["onchain", "macro"],
  },
  {
    id: "ethereum-blog",
    label: "Ethereum Blog",
    url: "https://blog.ethereum.org/feed.xml",
    website: "https://blog.ethereum.org",
    parser: "rss",
    categories: ["onchain", "solana"],
  },
  {
    id: "finance-magnates",
    label: "Finance Magnates",
    url: "https://www.financemagnates.com/cryptocurrency/feed/",
    website: "https://www.financemagnates.com/cryptocurrency/",
    parser: "rss",
    categories: ["trading", "macro"],
  },
  {
    id: "investing",
    label: "Investing.com",
    url: "https://www.investing.com/rss/news_301.rss",
    website: "https://www.investing.com/news/cryptocurrency-news",
    parser: "rss",
    categories: ["trading", "macro"],
  },
  {
    id: "coinmarketcap",
    label: "CoinMarketCap",
    url: "https://coinmarketcap.com/headlines/news/",
    website: "https://coinmarketcap.com/headlines/news/",
    parser: "coinmarketcap",
    categories: ["solana", "trading"],
  },
  {
    id: "coingecko",
    label: "CoinGecko",
    url: "https://www.coingecko.com/en/news/feed",
    website: "https://www.coingecko.com/en/news",
    parser: "rss",
    categories: ["solana", "trading"],
  },
  {
    id: "bitcoin-com",
    label: "Bitcoin.com",
    url: "https://news.bitcoin.com/feed",
    website: "https://news.bitcoin.com",
    parser: "rss",
    categories: ["solana", "macro"],
  },
  {
    id: "trustnodes",
    label: "Trustnodes",
    url: "https://www.trustnodes.com/feed",
    website: "https://www.trustnodes.com",
    parser: "rss",
    categories: ["trading", "macro"],
  },
  {
    id: "cryptobriefing",
    label: "Crypto Briefing",
    url: "https://cryptobriefing.com/feed",
    website: "https://cryptobriefing.com",
    parser: "rss",
    categories: ["solana", "trading"],
  },
  {
    id: "u-today",
    label: "U.Today",
    url: "https://u.today/rss.php",
    website: "https://u.today",
    parser: "rss",
    categories: ["solana", "trading"],
  },
  {
    id: "cryptoslate",
    label: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    website: "https://cryptoslate.com",
    parser: "rss",
    categories: ["solana", "trading"],
  },
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  trimValues: true,
  cdataPropName: "cdata",
  textNodeName: "text",
});

function normalizeApiArticles(payload: NewsApiResponse) {
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

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function pickText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return pickText(value[0]);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      pickText(record.text) ||
      pickText(record.cdata) ||
      pickText(record["#text"]) ||
      ""
    );
  }

  return "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeDate(value: string | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

function normalizeUrl(rawUrl: string, baseUrl: string) {
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return "";
  }
}

function readLink(value: unknown, baseUrl: string) {
  if (typeof value === "string") {
    return normalizeUrl(value, baseUrl);
  }

  if (Array.isArray(value)) {
    const objectLink = value.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const href = (entry as Record<string, unknown>).href;
      return typeof href === "string" && href.length > 0;
    });

    if (objectLink && typeof objectLink === "object") {
      return normalizeUrl((objectLink as Record<string, string>).href, baseUrl);
    }

    return readLink(value[0], baseUrl);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.href === "string") {
      return normalizeUrl(record.href, baseUrl);
    }
    if (typeof record.url === "string") {
      return normalizeUrl(record.url, baseUrl);
    }
  }

  return "";
}

function parseXmlFeed(text: string, source: NewsSource): NewsArticle[] {
  const parsed = xmlParser.parse(text) as Record<string, unknown>;
  const rssItems = asArray(
    (parsed.rss as { channel?: { item?: unknown } } | undefined)?.channel?.item,
  );
  const atomItems = asArray((parsed.feed as { entry?: unknown } | undefined)?.entry);
  const items = rssItems.length ? rssItems : atomItems;

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const title = pickText(record.title);
      const link =
        readLink(record.link, source.website) ||
        readLink(record.guid, source.website) ||
        source.website;
      const description = stripHtml(
        pickText(record.description) ||
          pickText(record.summary) ||
          pickText(record["content:encoded"]) ||
          pickText(record.content),
      );
      const pubDate = normalizeDate(
        pickText(record.pubDate) ||
          pickText(record.updated) ||
          pickText(record.published) ||
          pickText(record["dc:date"]),
      );

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        description,
        pubDate,
        source: source.label,
        sourceKey: source.id,
      } satisfies NewsArticle;
    })
    .filter(isDefined);
}

function parseCoinMarketCapFeed(text: string, source: NewsSource): NewsArticle[] {
  const nextDataMatch = text.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i,
  );

  if (!nextDataMatch?.[1]) {
    return [];
  }

  const nextData = JSON.parse(nextDataMatch[1]) as {
    props?: {
      pageProps?: {
        headlinesLatest?: CoinMarketCapArticle[];
      };
    };
  };
  const items = nextData.props?.pageProps?.headlinesLatest ?? [];

  return items
    .map((item) => {
      const title = item.meta?.title?.trim();
      const link = item.meta?.sourceUrl?.trim();
      const description = item.meta?.subtitle?.trim() ?? "";
      const pubDate = normalizeDate(item.meta?.releasedAt);
      const itemSource = item.meta?.sourceName?.trim() || source.label;

      if (!title || !link) {
        return null;
      }

      return {
        title,
        link,
        description,
        pubDate,
        source: itemSource,
        sourceKey: source.id,
      } satisfies NewsArticle;
    })
    .filter(isDefined);
}

async function fetchSourceArticles(source: NewsSource) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      },
      next: { revalidate: 180 },
    });

    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    return source.parser === "coinmarketcap"
      ? parseCoinMarketCapFeed(text, source)
      : parseXmlFeed(text, source);
  } catch {
    return [];
  }
}

function buildCustomSource(feedUrl: string): NewsSource | null {
  try {
    const url = new URL(feedUrl.trim());
    return {
      id: `custom-${url.hostname}-${url.pathname}`,
      label: url.hostname,
      url: url.toString(),
      website: `${url.protocol}//${url.hostname}`,
      parser: "rss",
      categories: ["solana", "onchain", "trading", "macro"],
    };
  } catch {
    return null;
  }
}

function uniqueArticles(articles: NewsArticle[]) {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = article.link.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sortArticles(articles: NewsArticle[]) {
  return [...articles].sort((left, right) => {
    return new Date(right.pubDate).getTime() - new Date(left.pubDate).getTime();
  });
}

export async function loadNewsFeed(input: {
  category?: string;
  query?: string;
  limit?: number;
  rssFeeds?: string[];
}): Promise<NewsFeed> {
  const category = (input.category?.trim().toLowerCase() || "solana") as NewsCategoryId;
  const query = input.query?.trim() || "";
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 12);
  const customSources = (input.rssFeeds ?? [])
    .map((url) => buildCustomSource(url))
    .filter((source): source is NewsSource => Boolean(source));
  const catalogSources = query
    ? NEWS_SOURCE_CATALOG
    : NEWS_SOURCE_CATALOG.filter((source) => source.categories.includes(category));

  const apiPromise = query
    ? fetchJson(
        `${NEWS_API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      )
    : fetchJson(
        `${NEWS_API_BASE}/api/news?category=${encodeURIComponent(category)}&limit=${limit}`,
      );

  const apiPayload = await apiPromise.catch(() => null);

  const apiArticles = apiPayload ? normalizeApiArticles(apiPayload) : [];
  const rssSources = apiArticles.length
    ? customSources
    : [...catalogSources, ...customSources];
  const rssResults = await Promise.all(
    rssSources.map(async (source) => ({
      source,
      articles: await fetchSourceArticles(source),
    })),
  );
  const rssArticles = rssResults.flatMap((result) => result.articles);
  const mergedArticles = sortArticles(uniqueArticles([...apiArticles, ...rssArticles]));
  const filteredArticles = query
    ? mergedArticles.filter((article) => {
        const haystack = `${article.title} ${article.description} ${article.source}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : mergedArticles;
  const sources = Array.from(
    new Set([
      ...(apiPayload?.sources?.length
        ? apiPayload.sources
        : apiArticles.length
          ? apiArticles.map((article) => article.source)
          : catalogSources.map((source) => source.label)),
    ]),
  );

  return {
    mode: query ? "search" : "category",
    category,
    query: query || undefined,
    fetchedAt: apiPayload?.fetchedAt ?? new Date().toISOString(),
    totalCount: filteredArticles.length,
    articles: filteredArticles.slice(0, limit),
    sources,
  };
}
