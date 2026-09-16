import { Droplets, Scale, Hand, Ruler } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STORAGE_KEYS } from "./store";

export interface FieldDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: string;
}

export interface ModuleDef {
  id: "tanita" | "bp" | "grip" | "sitreach";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path: string;
  storageKey: string;
  fields: FieldDef[];
  supportsImage: boolean;
}

export const MODULES: ModuleDef[] = [
  {
    id: "tanita",
    title: "體脂組成",
    subtitle: "Tanita 體脂磅讀數",
    icon: Scale,
    path: "/tanita",
    storageKey: STORAGE_KEYS.tanita,
    supportsImage: true,
    fields: [
      { key: "weight", label: "體重", unit: "公斤", min: 20, max: 300, step: "0.1" },
      { key: "bodyFat", label: "體脂率", unit: "%", min: 1, max: 70, step: "0.1" },
      { key: "muscleMass", label: "肌肉量", unit: "公斤", min: 5, max: 120, step: "0.1" },
      { key: "bmi", label: "BMI", unit: "", min: 10, max: 60, step: "0.1" },
      { key: "visceralFat", label: "內臟脂肪等級", unit: "", min: 1, max: 59, step: "1" },
    ],
  },
  {
    id: "bp",
    title: "血壓",
    subtitle: "收縮壓・舒張壓・脈搏",
    icon: Droplets,
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
    title: "握力",
    subtitle: "按年齡性別評級",
    icon: Hand,
    path: "/grip",
    storageKey: STORAGE_KEYS.grip,
    supportsImage: false,
    fields: [{ key: "grip", label: "握力", unit: "公斤", min: 1, max: 100, step: "0.1" }],
  },
  {
    id: "sitreach",
    title: "坐位體前彎",
    subtitle: "柔軟度測試",
    icon: Ruler,
    path: "/sit-and-reach",
    storageKey: STORAGE_KEYS.sitreach,
    supportsImage: false,
    fields: [{ key: "distance", label: "前彎距離", unit: "厘米", min: -30, max: 60, step: "0.5" }],
  },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<
  ModuleDef["id"],
  ModuleDef
>;
