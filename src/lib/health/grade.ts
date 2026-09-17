import type { ModuleDef } from "./modules";
import {
  gradeBloodPressure,
  gradeBmi,
  gradeVisceralFat,
  isIsolatedSystolic,
  type BpTier,
} from "./charts";

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
      return [{ label: "無適用參考標準", tone: "neutral" }];
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
