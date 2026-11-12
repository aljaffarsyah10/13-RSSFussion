import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Article } from "@/types/models";

export interface ArticleFilters {
  q?: string;
  sourceId?: string;
  topicId?: string;
  readStatus?: "all" | "unread" | "read";
  savedOnly?: boolean;
  timeframe?: "all" | "today" | "3days" | "7days" | "30days";
  sort?: "newest" | "oldest" | "title-asc" | "title-desc";
  limit?: number;
  cursor?: string; // ISO date string of published_at for pagination
}

interface KeywordMatchNested {
  keywords?: {
    keyword: string;
    topic_id?: string | null;
    topics?: { id: string; name: string } | null;
  } | null;
}

interface ArticleRow {
  id: string;
  source_id: string;
  guid?: string;
  canonical_url: string;
  original_url: string;
  title: string;
  description: string;
  content_snippet?: string;
  author?: string;
  image_url?: string;
  published_at: string;
  fetched_at: string;
  created_at: string;
  rss_sources?: { name: string; user_id: string };
  saved_articles?: Array<{ id: string }>;
  article_read_status?: Array<{ id: string }>;
  article_keyword_matches?: KeywordMatchNested[];
}

function extractTagsFromMatches(matches?: KeywordMatchNested[]): {
  matchedKeywords: string[];
  topics: string[];
  topicIds: string[];
} {
  const keywordSet = new Set<string>();
  const topicSet = new Set<string>();
  const topicIdSet = new Set<string>();

  for (const m of matches || []) {
    const kw = m.keywords;
    if (kw?.keyword) {
      keywordSet.add(kw.keyword);
    }
    if (kw?.topic_id) {
      topicIdSet.add(kw.topic_id);
    }
    if (kw?.topics?.name) {
      topicSet.add(kw.topics.name);
    }
  }

  return {
    matchedKeywords: Array.from(keywordSet),
    topics: Array.from(topicSet),
    topicIds: Array.from(topicIdSet),
  };
}

/**
 * Sanitizes a user search string for safe use inside PostgREST `.or()` filter expressions.
 */
export function sanitizeSearchQuery(rawQuery: string): string {
  return rawQuery
    .replace(/[,()%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export async function listArticles(userId: string, filters: ArticleFilters = {}): Promise<Article[]> {
  const supabase = await createServerSupabaseClient();
  const limit = Math.min(Math.max(filters.limit || 20, 1), 50);

  // Over-fetch when in-memory post-filters (topicId / unread / savedOnly) are active so pagination stays full
  const needsPostFilter =
    Boolean(filters.topicId) ||
    Boolean(filters.savedOnly) ||
    filters.readStatus === "unread" ||
    filters.readStatus === "read";
  const fetchLimit = needsPostFilter ? Math.min(limit * 3, 100) : limit;

  let query = supabase
    .from("articles")
    .select(
      `
      id,
      source_id,
      guid,
      canonical_url,
      original_url,
      title,
      description,
      content_snippet,
      author,
      image_url,
      published_at,
      fetched_at,
      created_at,
      rss_sources!inner(name, user_id),
      saved_articles(id),
      article_read_status(id),
      article_keyword_matches(
        keywords(
          keyword,
          topic_id,
          topics(id, name)
        )
      )
    `
    )
    .eq("rss_sources.user_id", userId);

  // Sorting
  if (filters.sort === "oldest") {
    query = query.order("published_at", { ascending: true });
  } else if (filters.sort === "title-asc") {
    query = query.order("title", { ascending: true });
  } else if (filters.sort === "title-desc") {
    query = query.order("title", { ascending: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  query = query.limit(fetchLimit);

  // Timeframe filter
  if (filters.timeframe && filters.timeframe !== "all") {
    const now = Date.now();
    let msAgo = 0;
    if (filters.timeframe === "today") msAgo = 24 * 60 * 60 * 1000;
    else if (filters.timeframe === "3days") msAgo = 3 * 24 * 60 * 60 * 1000;
    else if (filters.timeframe === "7days") msAgo = 7 * 24 * 60 * 60 * 1000;
    else if (filters.timeframe === "30days") msAgo = 30 * 24 * 60 * 60 * 1000;

    if (msAgo > 0) {
      const minIso = new Date(now - msAgo).toISOString();
      query = query.gte("published_at", minIso);
    }
  }

  if (filters.sourceId) {
    query = query.eq("source_id", filters.sourceId);
  }

  if (filters.q?.trim()) {
    const safeQ = sanitizeSearchQuery(filters.q);
    if (safeQ) {
      query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
    }
  }

  if (filters.cursor) {
    if (filters.sort === "oldest") {
      query = query.gt("published_at", filters.cursor);
    } else {
      query = query.lt("published_at", filters.cursor);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []) as unknown as ArticleRow[];

  let mapped = rows.map((row) => {
    const { matchedKeywords, topics, topicIds } = extractTagsFromMatches(
      row.article_keyword_matches
    );

    return {
      id: row.id,
      sourceId: row.source_id,
      sourceName: row.rss_sources?.name || "Feed",
      guid: row.guid,
      canonicalUrl: row.canonical_url,
      originalUrl: row.original_url,
      title: row.title,
      description: row.description,
      contentSnippet: row.content_snippet,
      author: row.author,
      imageUrl: row.image_url,
      publishedAt: row.published_at,
      fetchedAt: row.fetched_at,
      createdAt: row.created_at,
      isSaved: Boolean(row.saved_articles && row.saved_articles.length > 0),
      isRead: Boolean(row.article_read_status && row.article_read_status.length > 0),
      matchedKeywords,
      topics,
      _topicIds: topicIds,
    };
  });

  if (filters.topicId) {
    mapped = mapped.filter(
      (a) => a._topicIds.includes(filters.topicId!) || a.topics.includes(filters.topicId!)
    );
  }

  if (filters.savedOnly) {
    mapped = mapped.filter((a) => a.isSaved);
  }

  if (filters.readStatus === "unread") {
    mapped = mapped.filter((a) => !a.isRead);
  } else if (filters.readStatus === "read") {
    mapped = mapped.filter((a) => a.isRead);
  }

  return mapped.slice(0, limit).map((item) => ({
    id: item.id,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    guid: item.guid,
    canonicalUrl: item.canonicalUrl,
    originalUrl: item.originalUrl,
    title: item.title,
    description: item.description,
    contentSnippet: item.contentSnippet,
    author: item.author,
    imageUrl: item.imageUrl,
    publishedAt: item.publishedAt,
    fetchedAt: item.fetchedAt,
    createdAt: item.createdAt,
    isSaved: item.isSaved,
    isRead: item.isRead,
    matchedKeywords: item.matchedKeywords,
    topics: item.topics,
  }));
}

export async function markArticleRead(userId: string, articleId: string, isRead = true) {
  const supabase = await createServerSupabaseClient();
  if (isRead) {
    const { data, error } = await supabase
      .from("article_read_status")
      .upsert({ user_id: userId, article_id: articleId }, { onConflict: "user_id,article_id" })
      .select()
      .single();

    if (error) throw error;
    return { isRead: true, data };
  } else {
    const { error } = await supabase
      .from("article_read_status")
      .delete()
      .eq("user_id", userId)
      .eq("article_id", articleId);

    if (error) throw error;
    return { isRead: false };
  }
}

export async function saveArticle(userId: string, articleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_articles")
    .upsert({ user_id: userId, article_id: articleId }, { onConflict: "user_id,article_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unsaveArticle(userId: string, articleId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("saved_articles")
    .delete()
    .eq("user_id", userId)
    .eq("article_id", articleId);

  if (error) throw error;
  return { success: true };
}

export async function bulkMarkArticlesRead(
  userId: string,
  articleIds: string[],
  isRead = true
): Promise<{ affectedCount: number }> {
  if (!articleIds.length) return { affectedCount: 0 };
  const supabase = await createServerSupabaseClient();

  if (isRead) {
    const payload = articleIds.map((id) => ({
      user_id: userId,
      article_id: id,
    }));
    const { error } = await supabase
      .from("article_read_status")
      .upsert(payload, { onConflict: "user_id,article_id" });

    if (error) throw error;
    return { affectedCount: articleIds.length };
  } else {
    const { error } = await supabase
      .from("article_read_status")
      .delete()
      .eq("user_id", userId)
      .in("article_id", articleIds);

    if (error) throw error;
    return { affectedCount: articleIds.length };
  }
}

export async function bulkSaveArticles(
  userId: string,
  articleIds: string[],
  isSave = true
): Promise<{ affectedCount: number }> {
  if (!articleIds.length) return { affectedCount: 0 };
  const supabase = await createServerSupabaseClient();

  if (isSave) {
    const payload = articleIds.map((id) => ({
      user_id: userId,
      article_id: id,
    }));
    const { error } = await supabase
      .from("saved_articles")
      .upsert(payload, { onConflict: "user_id,article_id" });

    if (error) throw error;
    return { affectedCount: articleIds.length };
  } else {
    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("user_id", userId)
      .in("article_id", articleIds);

    if (error) throw error;
    return { affectedCount: articleIds.length };
  }
}

export async function markAllArticlesRead(
  userId: string,
  options?: { sourceId?: string; topicId?: string }
): Promise<{ markedCount: number }> {
  const articles = await listArticles(userId, {
    sourceId: options?.sourceId,
    topicId: options?.topicId,
    readStatus: "unread",
    limit: 100,
  });

  const unreadIds = articles.filter((a) => !a.isRead).map((a) => a.id);
  if (!unreadIds.length) {
    return { markedCount: 0 };
  }

  await bulkMarkArticlesRead(userId, unreadIds, true);
  return { markedCount: unreadIds.length };
}

interface SavedArticleRow {
  created_at: string;
  articles: {
    id: string;
    source_id: string;
    canonical_url: string;
    original_url: string;
    title: string;
    description: string;
    content_snippet?: string;
    author?: string;
    image_url?: string;
    published_at: string;
    fetched_at?: string;
    rss_sources?: { name: string };
    article_read_status?: Array<{ id: string }>;
    article_keyword_matches?: KeywordMatchNested[];
  };
}

export async function listSavedArticles(userId: string): Promise<Article[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_articles")
    .select(
      `
      created_at,
      articles(
        id,
        source_id,
        canonical_url,
        original_url,
        title,
        description,
        content_snippet,
        author,
        image_url,
        published_at,
        fetched_at,
        rss_sources(name),
        article_read_status(id),
        article_keyword_matches(
          keywords(
            keyword,
            topic_id,
            topics(id, name)
          )
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as unknown as SavedArticleRow[];

  return rows
    .filter((row) => Boolean(row.articles))
    .map((row) => {
      const { matchedKeywords, topics } = extractTagsFromMatches(
        row.articles.article_keyword_matches
      );

      return {
        id: row.articles.id,
        sourceId: row.articles.source_id,
        sourceName: row.articles.rss_sources?.name || "Feed",
        canonicalUrl: row.articles.canonical_url,
        originalUrl: row.articles.original_url,
        title: row.articles.title,
        description: row.articles.description,
        contentSnippet: row.articles.content_snippet,
        author: row.articles.author,
        imageUrl: row.articles.image_url,
        publishedAt: row.articles.published_at,
        fetchedAt: row.articles.fetched_at || row.articles.published_at,
        createdAt: row.created_at,
        isSaved: true,
        isRead: Boolean(
          row.articles.article_read_status && row.articles.article_read_status.length > 0
        ),
        matchedKeywords,
        topics,
      };
    });
}
