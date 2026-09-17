import { MODULES } from "./modules";
import { readEntries } from "./store";
import { gradeEntry } from "./grade";

// One-click CSV export. UTF-8 BOM is required or Excel mangles Traditional Chinese.
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportAllToCsv() {
  const rows: string[] = [];
  rows.push(["模組", "日期", "項目", "數值", "單位", "評級"].map(cell).join(","));

  for (const mod of MODULES) {
    for (const e of readEntries(mod.storageKey)) {
      const grades = gradeEntry(mod, e.values);
      const single = grades.length === 1 && !grades[0]?.metric ? (grades[0]?.label ?? "") : "";
      for (const f of mod.fields) {
        const v = e.values[f.key];
        if (v == null) continue;
        // A module-wide grade belongs to its primary field only — never repeated onto ungraded ones.
        const isPrimary = f.key === mod.fields[0]?.key;
        const grade = grades.find((g) => g.metric === f.label)?.label ?? (isPrimary ? single : "");
        rows.push([mod.title, e.date, f.label, String(v), f.unit, grade].map(cell).join(","));
      }
    }
  }

  const bom = "\uFEFF";
  const blob = new Blob([bom + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "健康紀錄.csv";
  a.click();
  URL.revokeObjectURL(url);
}
