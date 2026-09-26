// 職安局 (Occupational Safety and Health Council, OSHC) sit-and-reach norms
// — 5 tiers × 5 age bands × 2 genders. Values are the reach distance in
// centimetres (can be negative when the user cannot reach past their toes).
//
// Runtime callers: none. Per PRD L13/L50 + ADR 0025 the app never
// programmatically classifies the user (no gender/age collected). The
// summary card renders the full matrix as static JSX; the user
// self-identifies which row applies by visually finding their gender+age.
// `classifySitReach` is kept as the boundary-logic authority: a future
// PRD-authorised feature (or a build-time test) can call it without
// re-deriving thresholds.
//
// Source-data quirks (verbatim, not silently patched):
// - Male 30-39: Normal 25-29, Good 31-34 — value 30 is unclassified
// - Male 60-69: Normal 17-21, Good 23-29 — value 22 is unclassified
// `classifySitReach` returns undefined for both. The summary footer names
// these two values so users know to look at neighbours.

export const SIT_REACH_CATEGORIES = ["欠佳", "尚可", "常", "良好", "優異"] as const;
export type SitReachCategory = (typeof SIT_REACH_CATEGORIES)[number];

export const SIT_REACH_AGE_BANDS = ["20-29", "30-39", "40-49", "50-59", "60-69"] as const;
export type SitReachAgeBand = (typeof SIT_REACH_AGE_BANDS)[number];

export type SitReachGender = "male" | "female";

interface SitReachBand {
  poor_max: number;
  fair: readonly [number, number];
  normal: readonly [number, number];
  good: readonly [number, number];
  excellent_min: number;
}

export const SIT_REACH_NORMS: Record<SitReachGender, Record<SitReachAgeBand, SitReachBand>> = {
  male: {
    "20-29": { poor_max: 21, fair: [22, 26], normal: [27, 30], good: [31, 36], excellent_min: 37 },
    "30-39": { poor_max: 19, fair: [20, 24], normal: [25, 29], good: [31, 34], excellent_min: 35 },
    "40-49": { poor_max: 14, fair: [15, 20], normal: [21, 25], good: [26, 31], excellent_min: 32 },
    "50-59": { poor_max: 12, fair: [13, 20], normal: [21, 24], good: [25, 31], excellent_min: 32 },
    "60-69": { poor_max: 11, fair: [12, 16], normal: [17, 21], good: [23, 29], excellent_min: 30 },
  },
  female: {
    "20-29": { poor_max: 24, fair: [25, 29], normal: [30, 33], good: [34, 37], excellent_min: 38 },
    "30-39": { poor_max: 23, fair: [24, 28], normal: [29, 32], good: [33, 37], excellent_min: 38 },
    "40-49": { poor_max: 21, fair: [22, 26], normal: [27, 30], good: [31, 34], excellent_min: 35 },
    "50-59": { poor_max: 21, fair: [22, 26], normal: [27, 29], good: [30, 33], excellent_min: 34 },
    "60-69": { poor_max: 19, fair: [20, 23], normal: [24, 27], good: [28, 31], excellent_min: 32 },
  },
};

// Age → band. Returns undefined for ages outside 20-69.
export function ageToSitReachBand(age: number): SitReachAgeBand | undefined {
  if (age < 20) return undefined;
  if (age < 30) return "20-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  if (age < 70) return "60-69";
  return undefined;
}

// Classify a sit-and-reach distance (cm) against age × gender norms.
// Boundary rule: value ≤ tier upper bound belongs to that tier (向下取),
// matching the M25/M27/M28 convention. Returns undefined for uncovered
// ages OR for values landing in one of the 2 documented source gaps.
export function classifySitReach(
  age: number,
  gender: SitReachGender,
  distanceCm: number,
): SitReachCategory | undefined {
  const band = ageToSitReachBand(age);
  if (!band) return undefined;
  const n = SIT_REACH_NORMS[gender][band];
  if (distanceCm <= n.poor_max) return "欠佳";
  if (distanceCm <= n.fair[1]) return "尚可";
  if (distanceCm <= n.normal[1]) return "常";
  if (distanceCm < n.good[0]) return undefined; // source gap (male 30-39 @ 30; male 60-69 @ 22)
  if (distanceCm <= n.good[1]) return "良好";
  if (distanceCm >= n.excellent_min) return "優異";
  return undefined;
}
