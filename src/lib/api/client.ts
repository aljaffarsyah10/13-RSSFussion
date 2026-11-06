import { Article, DashboardStats, Keyword, RssSource, Topic } from "@/types/models";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  retries?: number;
}

export async function apiRequest<T>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const { retries = 0, headers, ...restOptions } = options || {};

  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    ...((headers as Record<string, string>) || {}),
  };

  if (restOptions.body && typeof restOptions.body === "string" && !mergedHeaders["Content-Type"]) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  let attempts = 0;
  const maxAttempts = retries + 1;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return null as unknown as T;
      }

      const text = await response.text();
      let json: Record<string, unknown> = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { raw: text };
      }

      if (!response.ok) {
        const errorPayload = json.error as { code?: string; message?: string; details?: unknown } | undefined;
        const errorMessage = errorPayload?.message || (json.message as string) || response.statusText || "Request failed";
        const errorCode = errorPayload?.code || (json.code as string);
        const details = errorPayload?.details;

        // If server 5xx and we have retries left, retry after backoff
        if (response.status >= 500 && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempts * 500));
          continue;
        }

        throw new ApiError(errorMessage, response.status, errorCode, details);
      }

      // If envelope contains `data`, return it, else return full JSON
      if ("data" in json) {
        // If pagination info exists alongside data, attach or return
        if ("nextCursor" in json) {
          return json as unknown as T;
        }
        return json.data as T;
      }

      return json as unknown as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }

      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempts * 500));
        continue;
      }

      const networkMsg = err instanceof Error ? err.message : "Network error occurred";
      throw new ApiError(networkMsg, 0, "NETWORK_ERROR");
    }
  }

  throw new ApiError("Failed after maximum retries", 0, "MAX_RETRIES_EXCEEDED");
}

// ---------------------------------------------------------------------------
// Specific API services
// ---------------------------------------------------------------------------

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiRequest<{ user: { id: string; email: string } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; fullName?: string }) =>
    apiRequest<{ user: { id: string; email: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    }),
};

export const sourcesApi = {
  list: () => apiRequest<RssSource[]>("/api/sources", { retries: 1 }),

  create: (data: { name: string; feedUrl: string; siteUrl?: string; description?: string }) =>
    apiRequest<RssSource>("/api/sources", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { name?: string; enabled?: boolean; description?: string; fetchIntervalMinutes?: number }
  ) =>
    apiRequest<RssSource>(`/api/sources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/sources/${id}`, {
      method: "DELETE",
    }),

  refresh: (id: string) =>
    apiRequest<RssSource>(`/api/sources/${id}/refresh`, {
      method: "POST",
    }),

  validate: (feedUrl: string) =>
    apiRequest<{ valid: boolean; title?: string; description?: string; siteUrl?: string; itemCount?: number }>(
      "/api/sources/validate",
      {
        method: "POST",
        body: JSON.stringify({ feedUrl }),
      }
    ),
};

export interface ArticlesResponse {
  data: Article[];
  nextCursor?: string | null;
}

export const articlesApi = {
  list: (params?: { q?: string; sourceId?: string; topicId?: string; cursor?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.sourceId) searchParams.set("sourceId", params.sourceId);
    if (params?.topicId) searchParams.set("topicId", params.topicId);
    if (params?.cursor) searchParams.set("cursor", params.cursor);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const url = query ? `/api/articles?${query}` : "/api/articles";
    return apiRequest<ArticlesResponse>(url, { retries: 1 });
  },

  markRead: (articleId: string) =>
    apiRequest<{ success: boolean }>(`/api/articles/${articleId}/read`, {
      method: "POST",
    }),

  save: (articleId: string) =>
    apiRequest<{ success: boolean }>("/api/saved", {
      method: "POST",
      body: JSON.stringify({ articleId }),
    }),

  unsave: (articleId: string) =>
    apiRequest<{ success: boolean }>(`/api/saved/${articleId}`, {
      method: "DELETE",
    }),
};

export const savedArticlesApi = {
  list: () => apiRequest<Article[]>("/api/saved", { retries: 1 }),
  save: (articleId: string) => articlesApi.save(articleId),
  unsave: (articleId: string) => articlesApi.unsave(articleId),
};

export const topicsApi = {
  list: () => apiRequest<Topic[]>("/api/topics", { retries: 1 }),

  create: (data: { name: string; description?: string }) =>
    apiRequest<Topic>("/api/topics", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiRequest<Topic>(`/api/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/topics/${id}`, {
      method: "DELETE",
    }),
};

export const keywordsApi = {
  list: () => apiRequest<Keyword[]>("/api/keywords", { retries: 1 }),

  create: (data: { keyword: string; topicId?: string }) =>
    apiRequest<Keyword>("/api/keywords", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { enabled?: boolean; topicId?: string | null }) =>
    apiRequest<Keyword>(`/api/keywords/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/keywords/${id}`, {
      method: "DELETE",
    }),
};

export const dashboardApi = {
  getStats: () => apiRequest<DashboardStats>("/api/dashboard/stats", { retries: 1 }),
};

export interface QuotaUsage {
  plan: string;
  limits: {
    maxSources: number;
    maxKeywords: number;
    maxTopics: number;
  };
  usage: {
    sources: number;
    topics: number;
    keywords: number;
  };
}

export const quotaApi = {
  getQuota: () => apiRequest<QuotaUsage>("/api/quota", { retries: 1 }),
};
