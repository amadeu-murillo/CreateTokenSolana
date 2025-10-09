// src/lib/cache.ts

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const METADATA_CACHE_KEY = 'tokenMetadataCache';

interface CacheData {
    [key: string]: {
        data: any;
        timestamp: number;
    };
}

/**
 * Lê o cache de metadados do localStorage.
 * @returns {CacheData} O objeto de cache.
 */
export const getMetadataCache = (): CacheData => {
    try {
        const cachedData = localStorage.getItem(METADATA_CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : {};
    } catch (e) {
        console.error("Falha ao ler o cache de metadados:", e);
        return {};
    }
};

/**
 * Salva o cache de metadados no localStorage.
 * @param {CacheData} cache O objeto de cache a ser salvo.
 */
export const setMetadataCache = (cache: CacheData) => {
    try {
        localStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Falha ao salvar o cache de metadados:", e);
    }
};

/**
 * Verifica se um item do cache ainda é válido.
 * @param {object} cacheItem O item do cache com `timestamp`.
 * @returns {boolean} `true` se o cache for válido, `false` caso contrário.
 */
export const isCacheItemValid = (cacheItem: { timestamp: number } | undefined): boolean => {
    return !!cacheItem && (Date.now() - cacheItem.timestamp < CACHE_DURATION_MS);
};
