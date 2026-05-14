import { isSameTypeCombo, isUnusedTypeCombination } from "../data/type-combinations.js";

const ELEMENT_SEED_ORDER = ["木", "火", "土", "金", "水"];

function getRequestedTypes(typeResult) {
  if (typeResult.primaryType === typeResult.secondaryType) {
    return [typeResult.primaryType];
  }

  return [typeResult.primaryType, typeResult.secondaryType];
}

function getElementSeedPart(sajuResult) {
  if (!sajuResult?.elements) {
    return "elements:none";
  }

  return ELEMENT_SEED_ORDER.map((element) => `${element}${sajuResult.elements[element] ?? 0}`).join("-");
}

export function hashSeed(inputData, sajuResult = null) {
  const seedString = [
    inputData.year,
    inputData.month,
    inputData.day,
    inputData.hourUnknown ? 0 : inputData.hourValue,
    getElementSeedPart(sajuResult),
  ].join("|");

  return [...seedString].reduce((hash, char) => {
    return Math.imul(hash, 31) + char.charCodeAt(0) >>> 0;
  }, 2166136261);
}

function pickSeededCandidate(candidates, inputData, sajuResult) {
  const index = hashSeed(inputData, sajuResult) % candidates.length;
  return candidates[index];
}

export function matchPokemon(typeResult, inputData, pokemonPool, sajuResult = null) {
  const requestedTypes = getRequestedTypes(typeResult);
  const usedFallback = Boolean(pokemonPool.usedFallback);
  const dataSource = pokemonPool.dataSource ?? (usedFallback ? "fallback" : "api");
  const candidates = pokemonPool.filter((pokemon) => {
    return isSameTypeCombo(pokemon.types, requestedTypes);
  });

  if (candidates.length > 0) {
    return {
      status: "matched",
      pokemon: pickSeededCandidate(candidates, inputData, sajuResult),
      candidatesCount: candidates.length,
      isUnusedCombination: false,
      usedFallback,
      dataSource,
      message: "당신의 오행 타입과 가장 가까운 포켓몬입니다.",
    };
  }

  if (isUnusedTypeCombination(requestedTypes)) {
    return {
      status: "unused-combination",
      pokemon: null,
      candidatesCount: 0,
      isUnusedCombination: true,
      unusedTypes: requestedTypes,
      usedFallback,
      dataSource,
      message: "아직 공식 포켓몬에게는 없는 희귀 타입 조합입니다.",
    };
  }

  return {
    status: "data-missing",
    pokemon: null,
    candidatesCount: 0,
    isUnusedCombination: false,
    usedFallback,
    dataSource,
    message: "현재 불러온 포켓몬 데이터에서 이 타입 조합을 찾지 못했습니다.",
  };
}

export function matchPokemonByProfile(typeProfile, pokemonDataset, seedSource, sajuResult = null) {
  return matchPokemon(typeProfile, seedSource, pokemonDataset, sajuResult);
}
