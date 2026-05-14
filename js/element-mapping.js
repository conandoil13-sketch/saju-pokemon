export const ELEMENT_TYPE_GROUPS = {
  木: ["grass", "bug", "fairy", "flying"],
  火: ["fire", "electric", "fighting", "dragon"],
  土: ["ground", "rock", "normal"],
  金: ["steel", "ice", "poison"],
  水: ["water", "ghost", "dark", "psychic"],
};

export const TYPE_KO_NAMES = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  electric: "전기",
  grass: "풀",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리",
};

const ELEMENT_ORDER = ["木", "火", "土", "金", "水"];
const ELEMENT_KO_NAMES = {
  木: "목",
  火: "화",
  土: "토",
  金: "금",
  水: "수",
};

const PILLAR_TIE_PRIORITY = ["day", "month", "hour", "year"];

const TYPE_BY_ELEMENT_RELATION = {
  木: {
    水: "grass",
    火: "flying",
    土: "bug",
    金: "fairy",
    木: "grass",
  },
  火: {
    木: "fire",
    金: "electric",
    土: "fighting",
    水: "dragon",
    火: "fire",
  },
  土: {
    火: "ground",
    金: "rock",
    木: "normal",
    水: "ground",
    土: "rock",
  },
  金: {
    土: "steel",
    水: "ice",
    火: "poison",
    木: "poison",
    金: "steel",
  },
  水: {
    金: "water",
    土: "ghost",
    火: "dark",
    木: "psychic",
    水: "water",
  },
};

const SAME_ELEMENT_DOMINANT_TYPES = {
  木: ["grass", "bug"],
  火: ["fire", "dragon"],
  土: ["normal", "rock"],
  金: ["ice", "poison"],
  水: ["water", "ghost"],
};

function getElementKoName(element) {
  return ELEMENT_KO_NAMES[element] ?? element;
}

function hasElementInPillar(pillar, element) {
  if (!pillar) {
    return false;
  }

  return pillar.stemElement === element || pillar.branchElement === element;
}

function compareElementsForTie(firstElement, secondElement, pillars) {
  for (const pillarKey of PILLAR_TIE_PRIORITY) {
    const firstHasPriority = hasElementInPillar(pillars[pillarKey], firstElement);
    const secondHasPriority = hasElementInPillar(pillars[pillarKey], secondElement);

    if (firstHasPriority !== secondHasPriority) {
      return firstHasPriority ? -1 : 1;
    }
  }

  return ELEMENT_ORDER.indexOf(firstElement) - ELEMENT_ORDER.indexOf(secondElement);
}

function getRankedElements(sajuResult) {
  return [...ELEMENT_ORDER].sort((firstElement, secondElement) => {
    const countDifference = sajuResult.elements[secondElement] - sajuResult.elements[firstElement];

    if (countDifference !== 0) {
      return countDifference;
    }

    return compareElementsForTie(firstElement, secondElement, sajuResult.pillars);
  });
}

function isDominantSameElement(element, sajuResult) {
  const dominantThreshold = sajuResult.usedCharacterCount >= 8 ? 4 : 3;
  return sajuResult.elements[element] >= dominantThreshold;
}

function getTypeByRelation(baseElement, partnerElement) {
  return TYPE_BY_ELEMENT_RELATION[baseElement][partnerElement] ?? ELEMENT_TYPE_GROUPS[baseElement][0];
}

function hashString(seedString) {
  return [...seedString].reduce((hash, char) => {
    return Math.imul(hash, 31) + char.charCodeAt(0) >>> 0;
  }, 2166136261);
}

function getResidualElementSeed(primaryElement, secondaryElement, elements) {
  return ELEMENT_ORDER.filter((element) => {
    return element !== primaryElement && element !== secondaryElement;
  })
    .map((element) => `${element}${elements[element] ?? 0}`)
    .join("|");
}

function pickTypeFromElementGroup(element, seedString) {
  const typeGroup = ELEMENT_TYPE_GROUPS[element];
  return typeGroup[hashString(seedString) % typeGroup.length];
}

function getSecondaryTypeByResidualElements(primaryElement, secondaryElement, sajuResult) {
  const residualSeed = getResidualElementSeed(primaryElement, secondaryElement, sajuResult.elements);

  return pickTypeFromElementGroup(
    secondaryElement,
    `${primaryElement}/${secondaryElement}|${residualSeed}`,
  );
}

export function getPokemonTypeFromElements(sajuResult) {
  const rankedElements = getRankedElements(sajuResult);
  const primaryElement = rankedElements[0];
  let secondaryElement = rankedElements[1] ?? primaryElement;
  let primaryType = getTypeByRelation(primaryElement, secondaryElement);
  let secondaryType = getSecondaryTypeByResidualElements(primaryElement, secondaryElement, sajuResult);
  const notes = [];
  const isSameElementDominant = isDominantSameElement(primaryElement, sajuResult);

  if (isSameElementDominant) {
    secondaryElement = primaryElement;
    [primaryType, secondaryType] = SAME_ELEMENT_DOMINANT_TYPES[primaryElement];
    notes.push(
      `${getElementKoName(primaryElement)} 오행이 강하게 편중되어 같은 오행 내부 타입 조합이 적용되었습니다.`,
    );
  }

  return {
    primaryElement,
    secondaryElement,
    primaryType,
    secondaryType,
    typeNamesKo: [TYPE_KO_NAMES[primaryType], TYPE_KO_NAMES[secondaryType]],
    elementLabel: `${getElementKoName(primaryElement)}${getElementKoName(secondaryElement)}형`,
    isSameElementDominant,
    notes,
  };
}

export function mapElementsToPokemonTypes(sajuResult) {
  return getPokemonTypeFromElements(sajuResult);
}
