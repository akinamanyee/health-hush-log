// 職安局 (Occupational Safety and Health Council, OSHC) hand-grip strength
// norms — 5 tiers × 5 age bands × 2 genders. Values are combined L+R grip
// in kg.
//
// Runtime callers: none. Per PRD L13/L50 + ADR 0025 the app never
// programmatically classifies the user (no gender/age collected). The
// summary card renders the full matrix as static JSX; the user
// self-identifies which row applies by visually finding their gender+age.
// `classifyHandGrip` is kept as the boundary-logic authority: a future
// PRD-authorised feature (or a build-time test) can call it without
// re-deriving thresholds.

export const HAND_GRIP_CATEGORIES = ["欠佳", "尚可", "常", "良好", "優異"] as const;
export type HandGripCategory = (typeof HAND_GRIP_CATEGORIES)[number];

export const HAND_GRIP_AGE_BANDS = ["20-29", "30-39", "40-49", "50-59", "60-69"] as const;
export type HandGripAgeBand = (typeof HAND_GRIP_AGE_BANDS)[number];

export type HandGripGender = "male" | "female";

interface HandGripBand {
  poor_max: number;
  fair: readonly [number, number];
  normal: readonly [number, number];
  good: readonly [number, number];
  excellent_min: number;
}

export const HAND_GRIP_NORMS: Record<HandGripGender, Record<HandGripAgeBand, HandGripBand>> = {
  male: {
    "20-29": { poor_max: 61, fair: [62, 69], normal: [70, 81], good: [82, 91], excellent_min: 92 },
    "30-39": { poor_max: 60, fair: [61, 68], normal: [69, 80], good: [81, 89], excellent_min: 90 },
    "40-49": { poor_max: 58, fair: [59, 66], normal: [67, 78], good: [79, 86], excellent_min: 87 },
    "50-59": { poor_max: 52, fair: [53, 60], normal: [61, 72], good: [73, 80], excellent_min: 81 },
    "60-69": { poor_max: 47, fair: [48, 55], normal: [56, 67], good: [68, 75], excellent_min: 76 },
  },
  female: {
    "20-29": { poor_max: 34, fair: [35, 39], normal: [40, 47], good: [48, 54], excellent_min: 55 },
    "30-39": { poor_max: 36, fair: [37, 40], normal: [41, 49], good: [50, 55], excellent_min: 56 },
    "40-49": { poor_max: 32, fair: [33, 36], normal: [37, 45], good: [46, 51], excellent_min: 52 },
    "50-59": { poor_max: 30, fair: [31, 34], normal: [35, 43], good: [44, 49], excellent_min: 50 },
    "60-69": { poor_max: 27, fair: [28, 31], normal: [32, 40], good: [41, 47], excellent_min: 48 },
  },
};

// Age → band. Returns undefined for ages outside 20-69 (source doesn't cover them).
export function ageToHandGripBand(age: number): HandGripAgeBand | undefined {
  if (age < 20) return undefined;
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  return undefined;
}

// Classify a combined L+R hand-grip reading (kg) against age × gender norms.
// Boundary rule: value ≤ tier upper bound belongs to that tier (向下取),
// matching the M25/M27 TANITA convention. Returns undefined for uncovered ages.
export function classifyHandGrip(
  age: number,
  gender: HandGripGender,
  combinedKg: number,
): HandGripCategory | undefined {
  const band = ageToHandGripBand(age);
  if (!band) return undefined;
  const n = HAND_GRIP_NORMS[gender][band];
  if (combinedKg <= n.poor_max) return "欠佳";
  if (combinedKg <= n.fair[1]) return "尚可";
  if (combinedKg <= n.normal[1]) return "常";
  if (combinedKg <= n.good[1]) return "良好";
  return "優異";
}
