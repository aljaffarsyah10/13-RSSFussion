import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ArticleFilters {
  q?: string;
  sourceId?: string;
  topicId?: string;
  limit?: number;
  cursor?: string; // ISO date string of published_at for pagination
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
}

export async function listArticles(userId: string, filters: ArticleFilters = {}) {
  const supabase = await createServerSupabaseClient();
  const limit = Math.min(filters.limit || 20, 50);

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
      article_read_status(id)
    `
    )
    .eq("rss_sources.user_id", userId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (filters.sourceId) {
    query = query.eq("source_id", filters.sourceId);
  }

  if (filters.q?.trim()) {
    query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  }

  if (filters.cursor) {
    query = query.lt("published_at", filters.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []) as unknown as ArticleRow[];

  return rows.map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.rss_sources?.name || "Feed",
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
  }));
}

export async function markArticleRead(userId: string, articleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("article_read_status")
    .upsert({ user_id: userId, article_id: articleId }, { onConflict: "user_id,article_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
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
    rss_sources?: { name: string };
  };
}

export async function listSavedArticles(userId: string) {
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
        rss_sources(name)
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as unknown as SavedArticleRow[];

  return rows.map((row) => ({
    ...row.articles,
    sourceName: row.articles?.rss_sources?.name || "Feed",
    isSaved: true,
  }));
}
