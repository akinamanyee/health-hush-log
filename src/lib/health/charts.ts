// Deterministic grading tables. AI never grades — these charts do.
// Sources: blood-pressure tiers follow common international reference charts
// (ESH/ACC-AHA style categories); hand-grip and sit-and-reach matrices are
// age/gender normative bands bundled with the app. The app does not collect
// age/gender, so those matrices are retained as reference material only.

export type Gender = "male" | "female";

export interface BpTier {
  id: string;
  label: string;
  description: string;
  recheckMonths: number | "urgent";
}

export const BP_TIERS: BpTier[] = [
  { id: "normal", label: "正常", description: "血壓處於理想範圍", recheckMonths: 24 },
  { id: "elevated", label: "正常偏高", description: "建議留意生活習慣", recheckMonths: 12 },
  { id: "stage1", label: "高血壓（第一期）", description: "建議諮詢醫生", recheckMonths: 6 },
  { id: "stage2", label: "高血壓（第二期）", description: "建議盡快諮詢醫生", recheckMonths: 6 },
  { id: "crisis", label: "嚴重偏高", description: "請即時就醫", recheckMonths: "urgent" },
];

// Evaluate systolic and diastolic independently, take the worse of the two —
// this is what makes isolated systolic hypertension (e.g. 152/78) grade
// correctly instead of being averaged away.
export function gradeBloodPressure(systolic: number, diastolic: number): BpTier {
  const sysIdx =
    systolic >= 180 ? 4 : systolic >= 160 ? 3 : systolic >= 140 ? 2 : systolic >= 120 ? 1 : 0;
  const diaIdx =
    diastolic >= 110 ? 4 : diastolic >= 100 ? 3 : diastolic >= 90 ? 2 : diastolic >= 80 ? 1 : 0;
  return BP_TIERS[Math.max(sysIdx, diaIdx)]!;
}

export function isIsolatedSystolic(systolic: number, diastolic: number): boolean {
  return systolic >= 140 && diastolic < 90;
}

export interface NormBand {
  minAge: number;
  maxAge: number;
  low: number; // below → 偏弱
  high: number; // above → 良好
}

export interface NormTable {
  label: string;
  unit: string;
  male: NormBand[];
  female: NormBand[];
}

export const GRIP_NORMS: NormTable = {
  label: "手握力",
  unit: "公斤",
  male: [
    { minAge: 50, maxAge: 59, low: 32, high: 44 },
    { minAge: 60, maxAge: 69, low: 28, high: 39 },
    { minAge: 70, maxAge: 79, low: 24, high: 33 },
    { minAge: 80, maxAge: 120, low: 18, high: 27 },
  ],
  female: [
    { minAge: 50, maxAge: 59, low: 20, high: 28 },
    { minAge: 60, maxAge: 69, low: 17, high: 24 },
    { minAge: 70, maxAge: 79, low: 14, high: 21 },
    { minAge: 80, maxAge: 120, low: 10, high: 17 },
  ],
};

export const SIT_REACH_NORMS: NormTable = {
  label: "坐地前伸測試",
  unit: "厘米",
  male: [
    { minAge: 50, maxAge: 59, low: 0, high: 20 },
    { minAge: 60, maxAge: 69, low: -2, high: 17 },
    { minAge: 70, maxAge: 79, low: -5, high: 14 },
    { minAge: 80, maxAge: 120, low: -8, high: 10 },
  ],
  female: [
    { minAge: 50, maxAge: 59, low: 3, high: 24 },
    { minAge: 60, maxAge: 69, low: 1, high: 21 },
    { minAge: 70, maxAge: 79, low: -2, high: 18 },
    { minAge: 80, maxAge: 120, low: -5, high: 14 },
  ],
};

export type NormGrade = "偏弱" | "正常" | "良好" | "無適用參考標準";

export function gradeAgainstNorms(table: NormTable, value: number, age: number, gender: Gender): NormGrade {
  const band = table[gender].find((b) => age >= b.minAge && age <= b.maxAge);
  if (!band) return "無適用參考標準";
  if (value < band.low) return "偏弱";
  if (value > band.high) return "良好";
  return "正常";
}

// Body-composition bands. Deterministic, same status as the tables above.
export type BandGrade = "過輕" | "偏低" | "正常" | "偏高" | "過高" | "無適用參考標準";

// Asian BMI cut-offs.
export function gradeBmi(bmi: number): BandGrade {
  if (bmi < 18.5) return "過輕";
  if (bmi < 23) return "正常";
  if (bmi < 25) return "偏高";
  return "過高";
}

export function gradeBodyFat(percent: number, gender: Gender): BandGrade {
  const [low, high, veryHigh] = gender === "male" ? [11, 22, 27] : [21, 33, 39];
  if (percent < low) return "偏低";
  if (percent <= high) return "正常";
  if (percent <= veryHigh) return "偏高";
  return "過高";
}

export function gradeVisceralFat(level: number): BandGrade {
  if (level <= 9) return "正常";
  if (level <= 14) return "偏高";
  return "過高";
}

// Bundled reference-leaflet text: the ONLY material the AI summary may use.
export const REFERENCE_LEAFLET = `
【血壓參考】正常：收縮壓低於120且舒張壓低於80。正常偏高：收縮壓120–139或舒張壓80–89。高血壓第一期：收縮壓140–159或舒張壓90–99。高血壓第二期：收縮壓160–179或舒張壓100–109。嚴重偏高：收縮壓180或以上，或舒張壓110或以上，應即時就醫。單純收縮期高血壓指收縮壓140或以上而舒張壓低於90，常見於年長人士。建議：少鹽飲食、規律運動、維持健康體重、按時量度。
【身體成份分析儀參考】體脂率過高與心血管疾病風險相關。BMI（亞洲標準）：低於18.5屬過輕，18.5至22.9屬正常，23至24.9屬偏高，25或以上屬過高。體脂率：男性11%至22%屬正常，23%至27%屬偏高，超過27%屬過高；女性21%至33%屬正常，34%至39%屬偏高，超過39%屬過高。內臟脂肪等級9或以下屬健康範圍，10至14屬偏高，15或以上屬過高。維持肌肉量有助長者保持活動能力。
【手握力參考】手握力是長者肌力與整體健康的重要指標，手握力偏弱與活動能力下降相關。可透過握力球、阻力帶等簡單訓練改善。
【坐地前伸測試參考】坐地前伸測試反映膕繩肌與下背柔軟度。規律伸展可改善柔軟度，減少跌倒與腰背痛風險。
【一般建議】本應用程式所有內容僅供參考，不能取代醫生診斷。如讀數嚴重偏高或身體不適，請即時就醫。
`.trim();
