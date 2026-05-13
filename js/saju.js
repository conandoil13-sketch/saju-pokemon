export const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const FIVE_ELEMENTS = ["木", "火", "土", "金", "水"];

export const STEM_ELEMENTS = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

export const BRANCH_ELEMENTS = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  子: "水",
  亥: "水",
};

const YEAR_REFERENCE = 1984;
const DAY_REFERENCE_UTC = Date.UTC(2000, 0, 7);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTH_BRANCH_ORDER_FROM_IN = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
const MONTH_JIE_BOUNDARIES = [
  { month: 2, day: 4, branch: "寅", name: "입춘" },
  { month: 3, day: 6, branch: "卯", name: "경칩" },
  { month: 4, day: 5, branch: "辰", name: "청명" },
  { month: 5, day: 6, branch: "巳", name: "입하" },
  { month: 6, day: 6, branch: "午", name: "망종" },
  { month: 7, day: 7, branch: "未", name: "소서" },
  { month: 8, day: 8, branch: "申", name: "입추" },
  { month: 9, day: 8, branch: "酉", name: "백로" },
  { month: 10, day: 8, branch: "戌", name: "한로" },
  { month: 11, day: 7, branch: "亥", name: "입동" },
  { month: 12, day: 7, branch: "子", name: "대설" },
  { month: 1, day: 6, branch: "丑", name: "소한" },
];

const YEAR_STEM_TO_FIRST_MONTH_STEM = {
  甲: "丙",
  己: "丙",
  乙: "戊",
  庚: "戊",
  丙: "庚",
  辛: "庚",
  丁: "壬",
  壬: "壬",
  戊: "甲",
  癸: "甲",
};

const DAY_STEM_TO_FIRST_HOUR_STEM = {
  甲: "甲",
  己: "甲",
  乙: "丙",
  庚: "丙",
  丙: "戊",
  辛: "戊",
  丁: "庚",
  壬: "庚",
  戊: "壬",
  癸: "壬",
};

export const SAJU_TEST_CASES = [
  {
    input: {
      year: 1999,
      month: 12,
      day: 24,
      hourBranch: "子",
      hourValue: 23,
      hourUnknown: false,
    },
    expectedElements: {
      木: 0,
      火: 2,
      土: 2,
      金: 1,
      水: 3,
    },
    note: "외부 만세력 앱 기준 사용자가 확인한 오행 분포. 실제 검증값으로 교체 가능.",
  },
];

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function createPillar(stem, branch) {
  return {
    stem,
    branch,
    stemElement: STEM_ELEMENTS[stem],
    branchElement: BRANCH_ELEMENTS[branch],
  };
}

function getStemBranchByCycleIndex(cycleIndex) {
  return createPillar(
    HEAVENLY_STEMS[positiveModulo(cycleIndex, HEAVENLY_STEMS.length)],
    EARTHLY_BRANCHES[positiveModulo(cycleIndex, EARTHLY_BRANCHES.length)],
  );
}

function createEmptyElementCounts() {
  return FIVE_ELEMENTS.reduce((counts, element) => {
    counts[element] = 0;
    return counts;
  }, {});
}

function isOnOrAfter(month, day, boundaryMonth, boundaryDay) {
  return month > boundaryMonth || (month === boundaryMonth && day >= boundaryDay);
}

function getSolarYear(inputData) {
  return isOnOrAfter(inputData.month, inputData.day, 2, 4) ? inputData.year : inputData.year - 1;
}

export function calculateYearPillar(inputData) {
  const solarYear = getSolarYear(inputData);
  return getStemBranchByCycleIndex(solarYear - YEAR_REFERENCE);
}

function getMonthBranchInfo(inputData) {
  if (inputData.month === 1 && inputData.day < 6) {
    return { branch: "子", boundaryName: "대설 이후" };
  }

  const availableBoundaries = MONTH_JIE_BOUNDARIES.filter((entry) => {
      if (entry.month === 1) {
        return inputData.month === 1 && inputData.day >= entry.day;
      }

      return isOnOrAfter(inputData.month, inputData.day, entry.month, entry.day);
    });
  const boundary = availableBoundaries[availableBoundaries.length - 1];

  return boundary ? { branch: boundary.branch, boundaryName: boundary.name } : { branch: "丑", boundaryName: "소한 이후" };
}

export function calculateMonthPillar(yearStem, inputData) {
  const { branch, boundaryName } = getMonthBranchInfo(inputData);
  const firstMonthStem = YEAR_STEM_TO_FIRST_MONTH_STEM[yearStem];
  const branchOffset = MONTH_BRANCH_ORDER_FROM_IN.indexOf(branch);
  const stemStartIndex = HEAVENLY_STEMS.indexOf(firstMonthStem);
  const stem = HEAVENLY_STEMS[positiveModulo(stemStartIndex + branchOffset, HEAVENLY_STEMS.length)];

  return {
    ...createPillar(stem, branch),
    boundaryName,
  };
}

export function calculateDayPillar(year, month, day) {
  // Improved-local 기준: 2000-01-07을 甲子일로 둔 60갑자 순환.
  // 여러 공개 만세력/간지 계산식에서 사용하는 검증 기준일과 대조해 잡은 기준이며, 전문 만세력과 지속 검증 필요.
  const inputDayUtc = Date.UTC(year, month - 1, day);
  const dayDifference = Math.floor((inputDayUtc - DAY_REFERENCE_UTC) / MS_PER_DAY);

  return getStemBranchByCycleIndex(dayDifference);
}

export function calculateHourPillar(dayStem, hourBranch, hourUnknown) {
  if (hourUnknown) {
    return null;
  }

  const firstHourStem = DAY_STEM_TO_FIRST_HOUR_STEM[dayStem];
  const stemStartIndex = HEAVENLY_STEMS.indexOf(firstHourStem);
  const branchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);
  const stem = HEAVENLY_STEMS[positiveModulo(stemStartIndex + branchIndex, HEAVENLY_STEMS.length)];

  return createPillar(stem, hourBranch);
}

function countPillarElements(pillars) {
  const elements = createEmptyElementCounts();
  let usedCharacterCount = 0;

  Object.values(pillars).forEach((pillar) => {
    if (!pillar) {
      return;
    }

    elements[pillar.stemElement] += 1;
    elements[pillar.branchElement] += 1;
    usedCharacterCount += 2;
  });

  return { elements, usedCharacterCount };
}

function normalizeManualElementOverride(manualElements) {
  if (!manualElements) {
    return null;
  }

  const hasAnyValue = FIVE_ELEMENTS.some((element) => manualElements[element] !== null && manualElements[element] !== undefined && manualElements[element] !== "");

  if (!hasAnyValue) {
    return null;
  }

  return FIVE_ELEMENTS.reduce((elements, element) => {
    elements[element] = Math.max(0, Number(manualElements[element] ?? 0));
    return elements;
  }, {});
}

function compareElementCounts(actual, expected) {
  return FIVE_ELEMENTS.filter((element) => actual[element] !== expected[element]).map((element) => {
    return `${element}: 자동 ${actual[element]} / 기대 ${expected[element]}`;
  });
}

export function warnIfSajuTestCaseDiffers(testCase = SAJU_TEST_CASES[0]) {
  const result = calculateSaju(testCase.input);
  const diffs = compareElementCounts(result.elements, testCase.expectedElements);

  if (diffs.length > 0) {
    console.warn(`Saju test case differs: ${testCase.note}`, diffs);
  }

  return diffs;
}

export function calculateLegacySaju(inputData) {
  const year = getStemBranchByCycleIndex(inputData.year - YEAR_REFERENCE);
  const monthBranchBySolarMonth = {
    1: "丑",
    2: "寅",
    3: "卯",
    4: "辰",
    5: "巳",
    6: "午",
    7: "未",
    8: "申",
    9: "酉",
    10: "戌",
    11: "亥",
    12: "子",
  };
  const month = calculateMonthPillar(year.stem, {
    ...inputData,
    month: Number(Object.entries(monthBranchBySolarMonth).find(([, branch]) => branch === monthBranchBySolarMonth[inputData.month])?.[0] ?? inputData.month),
  });
  const day = calculateDayPillar(inputData.year, inputData.month, inputData.day);
  const hour = calculateHourPillar(day.stem, inputData.hourBranch, inputData.hourUnknown);
  const pillars = { year, month, day, hour };
  const { elements, usedCharacterCount } = countPillarElements(pillars);

  return {
    pillars,
    elements,
    usedCharacterCount,
    notes: ["legacy 계산은 최종 결과에 사용하지 않는 이전 MVP 근사 로직입니다."],
    calculationMode: "legacy",
    accuracyNotes: ["양력 월 기준 월주 근사와 입춘 미보정 구조입니다."],
    manualOverrideApplied: false,
  };
}

export function calculateSaju(inputData, options = {}) {
  const year = calculateYearPillar(inputData);
  const month = calculateMonthPillar(year.stem, inputData);
  const day = calculateDayPillar(inputData.year, inputData.month, inputData.day);
  const hour = calculateHourPillar(day.stem, inputData.hourBranch, inputData.hourUnknown);
  const pillars = { year, month, day, hour };
  const counted = countPillarElements(pillars);
  const manualElements = normalizeManualElementOverride(options.manualElements);
  const notes = [
    "월주는 양력 월 고정값이 아니라 절입일 근사 경계로 계산했습니다.",
    "오행 카운트는 천간/지지 겉글자 기준입니다.",
  ];
  const accuracyNotes = [
    "입춘 기준으로 년주를 보정합니다.",
    "월주는 주요 절기 절입일을 날짜 단위로 근사합니다. 실제 절입 시각 단위 만세력과 하루 정도 차이 날 수 있습니다.",
    "일주는 2000-01-07 甲子일 기준 60갑자 순환으로 계산합니다.",
    "지장간, 계절 가중치, 월령 가중치, 신강신약 판단은 아직 반영하지 않습니다.",
  ];

  if (inputData.hourUnknown) {
    notes.push("생시 미입력으로 시주는 제외되었습니다.");
  }

  if (manualElements) {
    notes.push("오행 직접 보정값이 적용되었습니다.");
    accuracyNotes.push("개발자/검증용 수동 보정으로 elements만 덮어썼고 사주팔자 글자는 자동 계산값을 유지합니다.");
  }

  // TODO: hidden stems / 지장간 포함 모드
  // TODO: 계절 가중치 / 월령 가중치
  // TODO: 신강신약 판단
  return {
    pillars,
    elements: manualElements ?? counted.elements,
    usedCharacterCount: counted.usedCharacterCount,
    notes,
    calculationMode: "improved-local",
    accuracyNotes,
    manualOverrideApplied: Boolean(manualElements),
  };
}

export function calculateElementProfile(inputData, options = {}) {
  return calculateSaju(inputData, options);
}
