// Deterministic grading tables. AI never grades — these charts do.
//
// Provenance (single named source per table, no blending, no extrapolation):
// - Blood pressure: 2017 ACC/AHA Hypertension Guideline categories
//   (normal / elevated / stage 1 / stage 2), plus the guideline's
//   hypertensive-crisis threshold of 180/110 mmHg.
// - BMI: WHO Asia-Pacific (2000) cut-offs for Asian adults.
// - Visceral fat: Tanita body-composition analyser manual rating scale
//   (1–9 healthy, 10–14 high, 15+ very high).
// Hand grip and sit-and-reach have no chart that applies without age and
// gender, which this app does not collect — those modules record the reading
// and report 「無適用參考標準」 rather than grading against a guessed band.

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

// Body-composition bands. Deterministic, same status as the tables above.
export type BandGrade = "過輕" | "偏低" | "正常" | "偏高" | "過高" | "無適用參考標準";

// Asian BMI cut-offs.
export function gradeBmi(bmi: number): BandGrade {
  if (bmi < 18.5) return "過輕";
  if (bmi < 23) return "正常";
  if (bmi < 25) return "偏高";
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
【身體水分參考】成年人身體水分一般佔體重的45%至65%，充足的水分有助維持代謝功能及器官運作。水分率偏低可能與脫水或肌肉量不足有關。
【基礎代謝率參考】基礎代謝率是指身體在完全靜止狀態下維持生命所需的最低熱量消耗。肌肉量較高者一般基礎代謝率亦較高。基礎代謝率可用千卡（kcal）或千焦（kJ）表示，1千卡約等於4.184千焦。
【手握力參考】手握力是長者肌力與整體健康的重要指標，手握力偏弱與活動能力下降相關。可透過握力球、阻力帶等簡單訓練改善。
【坐地前伸測試參考】坐地前伸測試反映膕繩肌與下背柔軟度。規律伸展可改善柔軟度，減少跌倒與腰背痛風險。
【一般建議】本應用程式所有內容僅供參考，不能取代醫生診斷。如讀數嚴重偏高或身體不適，請即時就醫。
`.trim();
