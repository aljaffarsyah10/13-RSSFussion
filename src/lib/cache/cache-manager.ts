import Redis from "ioredis";

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // timestamp in ms
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = 60): void {
    // Evict oldest if exceeding max entries
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPattern(patternPrefix: string): void {
    const prefix = patternPrefix.replace(/\*/g, "");
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

class CacheManager {
  private redisClient: Redis | null = null;
  private inMemoryCache = new InMemoryCache(2000);
  private redisFailed = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl && !redisUrl.includes("placeholder")) {
      try {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              this.redisFailed = true;
              return null;
            }
            return Math.min(times * 100, 1000);
          },
        });

        this.redisClient.on("error", (err) => {
          // Fall back gracefully to in-memory cache without crashing server
          this.redisFailed = true;
          if (process.env.NODE_ENV !== "test") {
            console.warn("[CacheManager] Redis warning (falling back to in-memory):", err.message);
          }
        });
      } catch {
        this.redisFailed = true;
      }
    }
  }

  public isRedisActive(): boolean {
    return Boolean(this.redisClient && !this.redisFailed && this.redisClient.status === "ready");
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient && !this.redisFailed) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          return JSON.parse(raw) as T;
        }
        return null;
      } catch {
        this.redisFailed = true;
      }
    }

    return this.inMemoryCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    // Always update local memory cache for zero-latency retrieval
    this.inMemoryCache.set(key, value, ttlSeconds);

    if (this.redisClient && !this.redisFailed) {
      try {
        const payload = JSON.stringify(value);
        await this.redisClient.setex(key, ttlSeconds, payload);
      } catch {
        this.redisFailed = true;
      }
    }
  }

  async del(key: string): Promise<void> {
    this.inMemoryCache.del(key);

    if (this.redisClient && !this.redisFailed) {
      try {
        await this.redisClient.del(key);
      } catch {
        this.redisFailed = true;
      }
    }
  }

  async delPattern(patternPrefix: string): Promise<void> {
    this.inMemoryCache.delPattern(patternPrefix);

    if (this.redisClient && !this.redisFailed) {
      try {
        const keys = await this.redisClient.keys(patternPrefix);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch {
        this.redisFailed = true;
      }
    }
  }

  /**
   * Helper that checks the cache first, and executes fetcherFn() on cache miss.
   */
  async remember<T>(key: string, ttlSeconds: number, fetcherFn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetcherFn();
    await this.set<T>(key, fresh, ttlSeconds);
    return fresh;
  }
}

export const cache = new CacheManager();
