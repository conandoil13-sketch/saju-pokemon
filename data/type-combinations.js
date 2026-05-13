// 업데이트 필요 가능성 있음: 포켓몬 신작/세대 업데이트에 따라 미사용 타입 조합은 바뀔 수 있다.
export const UNUSED_TYPE_COMBINATIONS = [
  "normal/ice",
  "normal/bug",
  "normal/rock",
  "normal/steel",
  "fairy/fire",
  "ice/poison",
  "fairy/ground",
  "bug/dragon",
  "ghost/rock",
];

export function normalizeTypeCombo(types) {
  return [...new Set(types)].sort().join("/");
}

export function isSameTypeCombo(a, b) {
  return normalizeTypeCombo(a) === normalizeTypeCombo(b);
}

export function isUnusedTypeCombination(types) {
  return UNUSED_TYPE_COMBINATIONS.includes(normalizeTypeCombo(types));
}
