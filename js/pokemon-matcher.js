import { isSameTypeCombo, isUnusedTypeCombination } from "../data/type-combinations.js";

function getRequestedTypes(typeResult) {
  if (typeResult.primaryType === typeResult.secondaryType) {
    return [typeResult.primaryType];
  }

  return [typeResult.primaryType, typeResult.secondaryType];
}

export function hashSeed(inputData) {
  const seedString = `${inputData.year}${inputData.month}${inputData.day}${inputData.hourUnknown ? 0 : inputData.hourValue}`;

  return [...seedString].reduce((hash, char) => {
    return hash + char.charCodeAt(0);
  }, 0);
}

function pickSeededCandidate(candidates, inputData) {
  const index = hashSeed(inputData) % candidates.length;
  return candidates[index];
}

export function matchPokemon(typeResult, inputData, pokemonPool) {
  const requestedTypes = getRequestedTypes(typeResult);
  const usedFallback = Boolean(pokemonPool.usedFallback);
  const dataSource = pokemonPool.dataSource ?? (usedFallback ? "fallback" : "api");
  const candidates = pokemonPool.filter((pokemon) => {
    return isSameTypeCombo(pokemon.types, requestedTypes);
  });

  if (candidates.length > 0) {
    return {
      status: "matched",
      pokemon: pickSeededCandidate(candidates, inputData),
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

export function matchPokemonByProfile(typeProfile, pokemonDataset, seedSource) {
  return matchPokemon(typeProfile, seedSource, pokemonDataset);
}
