import { STORAGE_KEYS } from "./store";

export interface FieldDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: string;
  optional?: boolean;
  group?: string;
}

export interface ModuleDef {
  id: "tanita" | "bp" | "grip" | "sitreach";
  title: string;
  subtitle: string;
  path: string;
  storageKey: string;
  fields: FieldDef[];
  supportsImage: boolean;
}

export const MODULES: ModuleDef[] = [
  {
    id: "tanita",
    title: "身體成份分析儀",
    subtitle: "身體成份分析儀讀數",
    path: "/tanita",
    storageKey: STORAGE_KEYS.tanita,
    supportsImage: true,
    fields: [
      { key: "weight", label: "體重", unit: "公斤", min: 20, max: 300, step: "0.1" },
      { key: "bodyFat", label: "體脂率", unit: "%", min: 1, max: 70, step: "0.1" },
      { key: "muscleMass", label: "肌肉量", unit: "公斤", min: 5, max: 120, step: "0.1" },
      { key: "bmi", label: "BMI", unit: "", min: 10, max: 60, step: "0.1" },
      { key: "visceralFat", label: "內臟脂肪等級", unit: "", min: 1, max: 59, step: "1" },
      { key: "fatMass", label: "體脂量", unit: "公斤", min: 0.1, max: 200, step: "0.1", optional: true, group: "體脂" },
      { key: "muscleRatio", label: "肌肉比率", unit: "%", min: 1, max: 80, step: "0.1", optional: true, group: "肌肉" },
      { key: "bodyWaterPct", label: "身體水分率", unit: "%", min: 10, max: 80, step: "0.1", optional: true, group: "身體水分" },
      { key: "bodyWaterKg", label: "身體水分量", unit: "公斤", min: 5, max: 200, step: "0.1", optional: true, group: "身體水分" },
      { key: "bmrKcal", label: "基礎代謝率", unit: "kcal", min: 500, max: 5000, step: "1", optional: true, group: "基礎代謝" },
      { key: "bmrKj", label: "基礎代謝率", unit: "kJ", min: 2000, max: 21000, step: "1", optional: true, group: "基礎代謝" },
      { key: "fatTrunk", label: "軀幹脂肪率", unit: "%", min: 1, max: 70, step: "0.1", optional: true, group: "部位脂肪率" },
      { key: "fatArmR", label: "右臂脂肪率", unit: "%", min: 1, max: 70, step: "0.1", optional: true, group: "部位脂肪率" },
      { key: "fatArmL", label: "左臂脂肪率", unit: "%", min: 1, max: 70, step: "0.1", optional: true, group: "部位脂肪率" },
      { key: "fatLegR", label: "右腿脂肪率", unit: "%", min: 1, max: 70, step: "0.1", optional: true, group: "部位脂肪率" },
      { key: "fatLegL", label: "左腿脂肪率", unit: "%", min: 1, max: 70, step: "0.1", optional: true, group: "部位脂肪率" },
      { key: "muscleTrunk", label: "軀幹肌肉量", unit: "公斤", min: 1, max: 60, step: "0.1", optional: true, group: "部位肌肉量" },
      { key: "muscleArmR", label: "右臂肌肉量", unit: "公斤", min: 0.1, max: 15, step: "0.1", optional: true, group: "部位肌肉量" },
      { key: "muscleArmL", label: "左臂肌肉量", unit: "公斤", min: 0.1, max: 15, step: "0.1", optional: true, group: "部位肌肉量" },
      { key: "muscleLegR", label: "右腿肌肉量", unit: "公斤", min: 0.5, max: 30, step: "0.1", optional: true, group: "部位肌肉量" },
      { key: "muscleLegL", label: "左腿肌肉量", unit: "公斤", min: 0.5, max: 30, step: "0.1", optional: true, group: "部位肌肉量" },
    ],
  },
  {
    id: "bp",
    title: "血壓",
    subtitle: "上壓・下壓・脈搏",
    path: "/blood-pressure",
    storageKey: STORAGE_KEYS.bp,
    supportsImage: true,
    fields: [
      { key: "systolic", label: "收縮壓（上壓）", unit: "mmHg", min: 50, max: 260, step: "1" },
      { key: "diastolic", label: "舒張壓（下壓）", unit: "mmHg", min: 30, max: 160, step: "1" },
      { key: "pulse", label: "脈搏", unit: "次/分鐘", min: 30, max: 220, step: "1" },
    ],
  },
  {
    id: "grip",
    title: "手握力",
    subtitle: "記錄手部肌力讀數",
    path: "/grip",
    storageKey: STORAGE_KEYS.grip,
    supportsImage: true,
    fields: [{ key: "grip", label: "手握力", unit: "公斤", min: 1, max: 100, step: "0.1" }],
  },
  {
    id: "sitreach",
    title: "坐地前伸測試",
    subtitle: "記錄柔軟度測試距離",
    path: "/sit-and-reach",
    storageKey: STORAGE_KEYS.sitreach,
    supportsImage: true,
    fields: [{ key: "distance", label: "前彎距離", unit: "厘米", min: -30, max: 60, step: "0.5" }],
  },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<
  ModuleDef["id"],
  ModuleDef
>;
