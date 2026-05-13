import { FALLBACK_POKEMON_POOL } from "../data/pokemon-fallback.js";
import { STATIC_POKEMON_POOL } from "../data/pokemon-pool.js";

export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
// 개발 테스트 중에는 151 또는 386으로 줄이면 초기 fetch 시간을 크게 줄일 수 있다.
export const POKEMON_POOL_LIMIT = 1025;
export const POKEMON_FETCH_BATCH_SIZE = 20;
export const CACHE_KEY = "SAJU_POKEMON_POOL_V1";
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function markPokemonPool(data, { usedFallback = false, dataSource = "api" } = {}) {
  Object.defineProperty(data, "usedFallback", {
    value: usedFallback,
    enumerable: false,
  });
  Object.defineProperty(data, "dataSource", {
    value: dataSource,
    enumerable: false,
  });

  return data;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status} ${url}`);
  }

  return response.json();
}

export function extractKoreanName(speciesPayload, fallbackName) {
  const koreanName = speciesPayload?.names?.find((entry) => entry.language?.name === "ko");
  return koreanName?.name ?? fallbackName;
}

export function extractImageUrl(pokemonPayload) {
  return (
    pokemonPayload.sprites?.other?.["official-artwork"]?.front_default ??
    pokemonPayload.sprites?.other?.home?.front_default ??
    pokemonPayload.sprites?.front_default ??
    null
  );
}

export async function fetchPokemonById(id) {
  const [pokemonPayload, speciesPayload] = await Promise.all([
    fetchJson(`${POKEAPI_BASE_URL}/pokemon/${id}`),
    fetchJson(`${POKEAPI_BASE_URL}/pokemon-species/${id}`),
  ]);

  const nameEn = pokemonPayload.name;

  return {
    id: pokemonPayload.id,
    nameEn,
    nameKo: extractKoreanName(speciesPayload, nameEn),
    types: pokemonPayload.types
      .sort((first, second) => first.slot - second.slot)
      .map((entry) => entry.type.name),
    imageUrl: extractImageUrl(pokemonPayload),
  };
}

export async function fetchPokemonPool(limit = POKEMON_POOL_LIMIT, options = {}) {
  const batchSize = options.batchSize ?? POKEMON_FETCH_BATCH_SIZE;
  const onProgress = options.onProgress;
  const pokemonPool = [];
  let done = 0;

  for (let startId = 1; startId <= limit; startId += batchSize) {
    const ids = Array.from(
      { length: Math.min(batchSize, limit - startId + 1) },
      (_, index) => startId + index,
    );

    const batchResults = await Promise.all(
      ids.map(async (id) => {
        try {
          return await fetchPokemonById(id);
        } catch (error) {
          console.warn(`Pokemon id ${id} fetch skipped.`, error);
          return null;
        } finally {
          done += 1;
          onProgress?.({ done, total: limit });
        }
      }),
    );

    pokemonPool.push(...batchResults.filter(Boolean));
  }

  return markPokemonPool(pokemonPool, { dataSource: "api" });
}

export function getCachedPokemonPool() {
  try {
    const rawCache = localStorage.getItem(CACHE_KEY);
    return rawCache ? JSON.parse(rawCache) : null;
  } catch (error) {
    console.warn("Pokemon cache read failed.", error);
    return null;
  }
}

export function setCachedPokemonPool(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      }),
    );
  } catch (error) {
    console.warn("Pokemon cache save failed.", error);
  }
}

export function isPokemonCacheValid(cache) {
  if (!cache || !Array.isArray(cache.data) || typeof cache.savedAt !== "number") {
    return false;
  }

  return Date.now() - cache.savedAt < CACHE_TTL_MS;
}

export async function getPokemonPool(options = {}) {
  if (STATIC_POKEMON_POOL.length > 0 && !options.forceRefresh) {
    options.onProgress?.({ done: STATIC_POKEMON_POOL.length, total: STATIC_POKEMON_POOL.length });
    return markPokemonPool([...STATIC_POKEMON_POOL], { dataSource: "static" });
  }

  const cache = getCachedPokemonPool();

  if (isPokemonCacheValid(cache)) {
    return markPokemonPool(cache.data, { dataSource: "cache" });
  }

  try {
    const data = await fetchPokemonPool(options.limit ?? POKEMON_POOL_LIMIT, options);

    if (data.length === 0) {
      throw new Error("No Pokemon data was fetched.");
    }

    setCachedPokemonPool(data);
    return markPokemonPool(data, { dataSource: "api" });
  } catch (error) {
    console.warn("PokeAPI fetch failed. Fallback Pokemon pool will be used.", error);
    return markPokemonPool([...FALLBACK_POKEMON_POOL], {
      usedFallback: true,
      dataSource: "fallback",
    });
  }
}

export async function fetchPokemonDataset(options = {}) {
  return getPokemonPool(options);
}
