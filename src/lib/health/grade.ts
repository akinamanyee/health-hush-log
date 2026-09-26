import type { ModuleDef } from "./modules";
import {
  gradeBloodPressure,
  gradeBmi,
  gradeVisceralFat,
  isIsolatedSystolic,
  type BpTier,
} from "./charts";

export interface CardInterpretation {
  name: string;
  value: string;
  grade: string;
  tone: Tone;
  range: string;
  action: string;
  note?: string;
  /** ISO yyyy-mm-dd of the saved entry this card was built from. */
  recordedAt?: string;
}

export type Tone = "ok" | "warn" | "bad" | "urgent" | "neutral";

export interface GradeResult {
  /** Metric name for multi-metric modules; undefined when the module has one grade. */
  metric?: string;
  label: string;
  description?: string;
  tone: Tone;
}

/** The single grading entry point. Every screen and the summary use this — never a local copy. */
export function gradeEntry(
  mod: ModuleDef,
  values: Record<string, number>,
): GradeResult[] {
  switch (mod.id) {
    case "bp": {
      const sys = values["systolic"];
      const dia = values["diastolic"];
      if (sys == null || dia == null) return [];
      const tier = gradeBloodPressure(sys, dia);
      const iso = isIsolatedSystolic(sys, dia) && tier.id !== "crisis";
      return [
        {
          label: iso ? `${tier.label}・單純收縮期高血壓` : tier.label,
          description: tier.description,
          tone: bpTone(tier),
        },
      ];
    }
    case "grip":
    case "sitreach": {
      const key = mod.id === "grip" ? "grip" : "distance";
      const v = values[key];
      if (v == null) return [];
      // Grip (M28) and sit-reach (M29) both have in-app 職安局 self-lookup
      // reference tables under their summary cards (PRD L51 Exception; ADR
      // 0025 Source change history). Returning no grade here keeps record-form
      // + logbook + CSV from carrying the now-misleading 「無適用參考標準」
      // label. Summary's interpretCard branches still hard-code the string as
      // their `grade` payload (via `grades[0]?.label ?? "無適用參考標準"`
      // fallback), so wire-sanitize and card SSOT behaviour are byte-identical.
      return [];
    }
    case "tanita": {
      const out: GradeResult[] = [];
      const bmi = values["bmi"];
      if (bmi != null) {
        const g = gradeBmi(bmi);
        out.push({ metric: "BMI", label: g, tone: bandTone(g) });
      }
      const fat = values["bodyFat"];
      if (fat != null) {
        out.push({ metric: "體脂率", label: "無適用參考標準", tone: "neutral" });
      }
      const visceral = values["visceralFat"];
      if (visceral != null) {
        const g = gradeVisceralFat(visceral);
        out.push({ metric: "內臟脂肪等級", label: g, tone: bandTone(g) });
      }
      return out;
    }
  }
}

function bpTone(tier: BpTier): Tone {
  if (tier.id === "normal") return "ok";
  if (tier.id === "elevated") return "warn";
  if (tier.id === "crisis") return "urgent";
  return "bad";
}

function bandTone(g: string): Tone {
  if (g === "正常") return "ok";
  if (g === "偏高" || g === "偏低" || g === "過輕") return "warn";
  if (g === "過高") return "bad";
  return "neutral";
}

export function interpretCard(
  mod: ModuleDef,
  values: Record<string, number>,
  recordedAt?: string,
): CardInterpretation[] {
  const grades = gradeEntry(mod, values);
  const cards = interpretCardCore(mod, values, grades);
  if (recordedAt) for (const c of cards) c.recordedAt = recordedAt;
  return cards;
}

function interpretCardCore(
  mod: ModuleDef,
  values: Record<string, number>,
  grades: ReturnType<typeof gradeEntry>,
): CardInterpretation[] {
  switch (mod.id) {
    case "bp": {
      const sys = values["systolic"];
      const dia = values["diastolic"];
      if (sys == null || dia == null || grades.length === 0) return [];
      const tier = gradeBloodPressure(sys, dia);
      const rangeMap: Record<string, string> = {
        normal: "收縮壓低於120且舒張壓低於80",
        elevated: "收縮壓120–139或舒張壓80–89",
        stage1: "收縮壓140–159或舒張壓90–99",
        stage2: "收縮壓160–179或舒張壓100–109",
        crisis: "收縮壓180或以上，或舒張壓110或以上",
      };
      const actionMap: Record<string, string> = {
        normal: "血壓處於理想範圍，建議每24個月檢查一次",
        elevated: "建議留意生活習慣，每12個月檢查一次",
        stage1: "建議諮詢醫生，每6個月檢查一次",
        stage2: "建議盡快諮詢醫生，每6個月檢查一次",
        crisis: "請即時就醫",
      };
      const pulse = values["pulse"];
      const pulseStr = pulse != null ? `，脈搏 ${pulse} 次/分鐘` : "";
      return [{
        name: "血壓",
        value: `${sys}/${dia} mmHg${pulseStr}`,
        grade: grades[0]!.label,
        tone: grades[0]!.tone,
        range: rangeMap[tier.id] ?? "",
        action: actionMap[tier.id] ?? "",
      }];
    }
    case "tanita": {
      const cards: CardInterpretation[] = [];
      const gradeByMetric = new Map(grades.map((g) => [g.metric, g]));

      const bmi = values["bmi"];
      if (bmi != null) {
        const g = gradeByMetric.get("BMI");
        const rangeMap: Record<string, string> = {
          "過輕": "BMI 低於18.5",
          "正常": "BMI 18.5至22.9",
          "偏高": "BMI 23至24.9",
          "過高": "BMI 25或以上",
        };
        cards.push({
          name: "BMI",
          value: `${bmi}`,
          grade: g?.label ?? "無適用參考標準",
          tone: g?.tone ?? "neutral",
          range: g ? (rangeMap[g.label] ?? "") : "",
          action: g?.label === "正常" ? "繼續維持健康體重" : g?.label === "過輕" ? "建議諮詢醫生或營養師" : "建議注意飲食及運動，必要時諮詢醫生",
        });
      }
      const fat = values["bodyFat"];
      if (fat != null) {
        const g = gradeByMetric.get("體脂率");
        cards.push({
          name: "體脂率",
          value: `${fat}%`,
          grade: g?.label ?? "無適用參考標準",
          tone: g?.tone ?? "neutral",
          range: "需要年齡及性別才能對照標準",
          action: "請參考檢查機構提供的年齡性別對照表",
          note: "無適用參考標準（需要年齡及性別）",
        });
      }
      const visceral = values["visceralFat"];
      if (visceral != null) {
        const g = gradeByMetric.get("內臟脂肪等級");
        const rangeMap: Record<string, string> = {
          "正常": "等級1至9屬健康範圍",
          "偏高": "等級10至14屬偏高",
          "過高": "等級15或以上屬過高",
        };
        cards.push({
          name: "內臟脂肪",
          value: `等級 ${visceral}`,
          grade: g?.label ?? "無適用參考標準",
          tone: g?.tone ?? "neutral",
          range: g ? (rangeMap[g.label] ?? "") : "",
          action: g?.label === "正常" ? "繼續維持健康生活習慣" : "建議注意飲食及增加運動，減少腰腹脂肪",
        });
      }
      const bmrKcal = values["bmrKcal"];
      if (bmrKcal != null) {
        cards.push({
          name: "基礎代謝率",
          value: `${bmrKcal.toLocaleString()} kcal`,
          grade: "無適用參考標準",
          tone: "neutral",
          range: "需要年齡及性別才能對照標準",
          action: "請對照下方 TANITA 參考表自行對照",
          note: "無適用參考標準（需要年齡及性別）",
        });
      }
      const bodyWaterPct = values["bodyWaterPct"];
      if (bodyWaterPct != null) {
        cards.push({
          name: "體內水分",
          value: `${bodyWaterPct}%`,
          grade: "無適用參考標準",
          tone: "neutral",
          range: "需要性別才能對照標準",
          action: "請對照下方 TANITA 參考表自行對照",
          note: "無適用參考標準（需要性別）",
        });
      }
      const smi = values["smi"];
      if (smi != null) {
        cards.push({
          name: "肌少症指數",
          value: `${smi} kg/m²`,
          grade: "無適用參考標準",
          tone: "neutral",
          range: "需要性別才能對照標準",
          action: "請對照下方 TANITA 參考表自行對照",
          note: "無適用參考標準（需要性別）",
        });
      }
      return cards;
    }
    case "grip": {
      const v = values["grip"];
      if (v == null) return [];
      return [{
        name: "手握力",
        value: `${v} 公斤`,
        grade: grades[0]?.label ?? "無適用參考標準",
        tone: grades[0]?.tone ?? "neutral",
        range: "需要年齡及性別才能對照標準",
        action: "請對照下方 職安局 參考表自行對照",
        note: "無適用參考標準（需要年齡及性別）",
      }];
    }
    case "sitreach": {
      const v = values["distance"];
      if (v == null) return [];
      return [{
        name: "坐地前伸",
        value: `${v} 厘米`,
        grade: grades[0]?.label ?? "無適用參考標準",
        tone: grades[0]?.tone ?? "neutral",
        range: "需要年齡及性別才能對照標準",
        action: "請對照下方 職安局 參考表自行對照",
        note: "無適用參考標準（需要年齡及性別）",
      }];
    }
  }
}
