interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;
  private maxSize: number;

  constructor(ttlMs: number, maxSize = 500) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

// 15 minute TTL, max 500 entries
export const metadataCache = new TTLCache<unknown>(15 * 60 * 1000, 500);
