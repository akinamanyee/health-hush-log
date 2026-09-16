import { MODULES } from "./modules";
import type { HealthEntry } from "./store";

// One-click CSV export. UTF-8 BOM is required or Excel mangles Traditional Chinese.
export function exportAllToCsv() {
  const rows: string[] = [];
  const header = ["模組", "日期", "項目", "數值", "單位"];
  rows.push(header.join(","));

  for (const mod of MODULES) {
    let entries: HealthEntry[] = [];
    try {
      const raw = window.localStorage.getItem(mod.storageKey);
      if (raw) entries = (JSON.parse(raw) as { v: number; data: HealthEntry[] }).data ?? [];
    } catch {
      continue;
    }
    for (const e of entries) {
      for (const f of mod.fields) {
        const v = e.values[f.key];
        if (v == null) continue;
        rows.push([mod.title, e.date, f.label, String(v), f.unit].join(","));
      }
    }
  }

  const bom = "﻿";
  const blob = new Blob([bom + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "健康紀錄.csv";
  a.click();
  URL.revokeObjectURL(url);
}
