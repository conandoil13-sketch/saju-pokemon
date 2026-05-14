import { writeFile } from "node:fs/promises";
import { STATIC_POKEMON_POOL } from "../data/pokemon-pool.js";
import { normalizeTypeCombo, isUnusedTypeCombination } from "../data/type-combinations.js";
import { getPokemonTypeFromElements } from "../js/element-mapping.js";
import { hashSeed } from "../js/pokemon-matcher.js";
import { calculateSaju } from "../js/saju.js";

const START_YEAR = 1900;
const END_YEAR = 2100;
const OUTPUT_PATH = new URL("../data/match-distribution-report.json", import.meta.url);

const HOURS = [
  { branch: null, value: 0, unknown: true, label: "시간 모름" },
  { branch: "子", value: 23, unknown: false, label: "23:00~00:59" },
  { branch: "丑", value: 1, unknown: false, label: "01:00~02:59" },
  { branch: "寅", value: 3, unknown: false, label: "03:00~04:59" },
  { branch: "卯", value: 5, unknown: false, label: "05:00~06:59" },
  { branch: "辰", value: 7, unknown: false, label: "07:00~08:59" },
  { branch: "巳", value: 9, unknown: false, label: "09:00~10:59" },
  { branch: "午", value: 11, unknown: false, label: "11:00~12:59" },
  { branch: "未", value: 13, unknown: false, label: "13:00~14:59" },
  { branch: "申", value: 15, unknown: false, label: "15:00~16:59" },
  { branch: "酉", value: 17, unknown: false, label: "17:00~18:59" },
  { branch: "戌", value: 19, unknown: false, label: "19:00~20:59" },
  { branch: "亥", value: 21, unknown: false, label: "21:00~22:59" },
];

function createInput(year, month, day, hour) {
  return {
    year,
    month,
    day,
    hourBranch: hour.branch,
    hourRangeLabel: hour.label,
    hourValue: hour.value,
    hourUnknown: hour.unknown,
  };
}

function getRequestedTypes(typeResult) {
  if (typeResult.primaryType === typeResult.secondaryType) {
    return [typeResult.primaryType];
  }

  return [typeResult.primaryType, typeResult.secondaryType];
}

function buildCandidatesByType() {
  return STATIC_POKEMON_POOL.reduce((map, pokemon) => {
    const key = normalizeTypeCombo(pokemon.types);
    const candidates = map.get(key) ?? [];

    candidates.push(pokemon);
    map.set(key, candidates);

    return map;
  }, new Map());
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function createPokemonKey(pokemon) {
  return `${pokemon.id}|${pokemon.nameKo}|${pokemon.nameEn}|${pokemon.types.join("/")}`;
}

function createPokemonRows(pokemonCounts, totalInputs) {
  return [...pokemonCounts.entries()]
    .map(([key, count]) => {
      const [id, nameKo, nameEn, types] = key.split("|");

      return {
        id: Number(id),
        nameKo,
        nameEn,
        types,
        count,
        percent: Number(((count / totalInputs) * 100).toFixed(4)),
      };
    })
    .sort((first, second) => second.count - first.count || first.id - second.id);
}

function createCountRows(counts, totalInputs, keyName) {
  return [...counts.entries()]
    .map(([key, count]) => ({
      [keyName]: key,
      count,
      percent: Number(((count / totalInputs) * 100).toFixed(4)),
    }))
    .sort((first, second) => second.count - first.count || String(first[keyName]).localeCompare(String(second[keyName])));
}

function analyze() {
  const candidatesByType = buildCandidatesByType();
  const pokemonCounts = new Map();
  const typeCounts = new Map();
  const statusCounts = new Map();
  let totalInputs = 0;

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const maxDay = new Date(year, month, 0).getDate();

      for (let day = 1; day <= maxDay; day += 1) {
        for (const hour of HOURS) {
          const inputData = createInput(year, month, day, hour);
          const sajuResult = calculateSaju(inputData);
          const typeResult = getPokemonTypeFromElements(sajuResult);
          const requestedTypes = getRequestedTypes(typeResult);
          const typeKey = normalizeTypeCombo(requestedTypes);
          const candidates = candidatesByType.get(typeKey) ?? [];

          totalInputs += 1;
          increment(typeCounts, typeResult.typeNamesKo.join("/"));

          if (candidates.length > 0) {
            const pokemon = candidates[hashSeed(inputData, sajuResult) % candidates.length];

            increment(statusCounts, "matched");
            increment(pokemonCounts, createPokemonKey(pokemon));
          } else if (isUnusedTypeCombination(requestedTypes)) {
            increment(statusCounts, "unused-combination");
          } else {
            increment(statusCounts, "data-missing");
          }
        }
      }
    }
  }

  const pokemonRows = createPokemonRows(pokemonCounts, totalInputs);
  const zeroMatchedPokemon = STATIC_POKEMON_POOL.length - pokemonRows.length;

  return {
    range: {
      startYear: START_YEAR,
      endYear: END_YEAR,
      hourOptions: HOURS.length,
    },
    totalInputs,
    uniqueMatchedPokemon: pokemonRows.length,
    zeroMatchedPokemon,
    statusCounts: Object.fromEntries(statusCounts),
    topPokemon: pokemonRows.slice(0, 30),
    bottomMatchedPokemon: pokemonRows.slice(-30),
    topTypes: createCountRows(typeCounts, totalInputs, "type").slice(0, 30),
  };
}

const report = analyze();

await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
