import { ELEMENT_TYPE_GROUPS } from "./element-mapping.js";

export const GENERATES = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

export const CONTROLS = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

const GENERATE_REASONS = {
  "木>火": "목은 화를 생해 불이 타오를 재료가 됩니다.",
  "火>土": "화는 토를 생해 타고 남은 것이 땅의 기반이 됩니다.",
  "土>金": "토는 금을 생해 땅속에서 금속과 광물이 만들어집니다.",
  "金>水": "금은 수를 생해 차갑고 응축된 흐름을 만듭니다.",
  "水>木": "수는 목을 생해 나무가 자라날 물을 줍니다.",
};

const CONTROL_REASONS = {
  "木>土": "목은 토를 극해 뿌리로 땅을 파고듭니다.",
  "土>水": "토는 수를 극해 물의 흐름을 막습니다.",
  "水>火": "수는 화를 극해 불을 꺼뜨립니다.",
  "火>金": "화는 금을 극해 금속을 녹입니다.",
  "金>木": "금은 목을 극해 나무를 베어냅니다.",
};

function getReverseRelation(relationMap, myElement) {
  return Object.entries(relationMap).find(([, targetElement]) => targetElement === myElement)?.[0] ?? null;
}

export function getElementThatGeneratesMe(myElement) {
  return getReverseRelation(GENERATES, myElement);
}

export function getElementThatControlsMe(myElement) {
  return getReverseRelation(CONTROLS, myElement);
}

export function findPokemonByElementTypeGroup(element, pokemonPool) {
  const typeGroup = ELEMENT_TYPE_GROUPS[element] ?? [];

  return pokemonPool.filter((pokemon) => {
    return pokemon.types.some((type) => typeGroup.includes(type));
  });
}

function hashSeed(inputData, salt) {
  const seedString = `${inputData.year}${inputData.month}${inputData.day}${inputData.hourUnknown ? 0 : inputData.hourValue}-${salt}`;

  return [...seedString].reduce((hash, char, index) => {
    return hash + char.charCodeAt(0) * (index + 1);
  }, 0);
}

export function pickSeededPokemon(candidates, inputData, salt) {
  if (candidates.length === 0) {
    return null;
  }

  return candidates[hashSeed(inputData, salt) % candidates.length];
}

function getGenerateReason(fromElement, toElement) {
  return GENERATE_REASONS[`${fromElement}>${toElement}`] ?? "서로의 기운을 북돋우는 상생 관계입니다.";
}

function getControlReason(fromElement, toElement) {
  return CONTROL_REASONS[`${fromElement}>${toElement}`] ?? "서로의 기운이 부딪히기 쉬운 상극 관계입니다.";
}

export function getCompatibilityPokemon(typeResult, inputData, pokemonPool) {
  const baseElement = typeResult.primaryElement;
  const compatibleElement = getElementThatGeneratesMe(baseElement);
  const incompatibleElement = getElementThatControlsMe(baseElement);
  const notes = [];
  const compatibleCandidates = compatibleElement ? findPokemonByElementTypeGroup(compatibleElement, pokemonPool) : [];
  const incompatibleCandidates = incompatibleElement ? findPokemonByElementTypeGroup(incompatibleElement, pokemonPool) : [];
  const compatiblePokemon = pickSeededPokemon(compatibleCandidates, inputData, "best");
  const incompatiblePokemon = pickSeededPokemon(incompatibleCandidates, inputData, "worst");

  if (!compatiblePokemon) {
    notes.push("상생 타입군에서 추천할 포켓몬 후보를 찾지 못했습니다.");
  }

  if (!incompatiblePokemon) {
    notes.push("상극 타입군에서 추천할 포켓몬 후보를 찾지 못했습니다.");
  }

  return {
    baseElement,
    compatibleElement,
    incompatibleElement,
    compatiblePokemon,
    incompatiblePokemon,
    compatibleReason: getGenerateReason(compatibleElement, baseElement),
    incompatibleReason: getControlReason(incompatibleElement, baseElement),
    compatibleCandidatesCount: compatibleCandidates.length,
    incompatibleCandidatesCount: incompatibleCandidates.length,
    notes,
  };
}
