const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_KEY = "tokenMetadataCache";

interface CacheData {
  [key: string]: {
    data: unknown;
    timestamp: number;
  };
}

/**
 * Reads token metadata cache from localStorage.
 */
export const getMetadataCache = (): CacheData => {
  try {
    const cachedData = localStorage.getItem(METADATA_CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : {};
  } catch (e) {
    console.error("Failed to read metadata cache:", e);
    return {};
  }
};

/**
 * Saves token metadata cache to localStorage.
 */
export const setMetadataCache = (cache: CacheData) => {
  try {
    localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save metadata cache:", e);
  }
};

/**
 * Checks if a cached item is still within its validity window.
 */
export const isCacheItemValid = (
  cacheItem: { timestamp: number } | undefined
): boolean => {
  return !!cacheItem && Date.now() - cacheItem.timestamp < CACHE_DURATION_MS;
};
