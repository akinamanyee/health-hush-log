import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import { clearAllHealthData } from "@/lib/health/store";
import { exportAllToCsv } from "@/lib/health/csv";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "./PrivacyNotice";
import bloodPressureAsset from "@/assets/bloodpressure.jpg.asset.json";
import bodyCompositionAsset from "@/assets/scale.jpg.asset.json";
import handGripAsset from "@/assets/handgrip.jpg.asset.json";
import stretchingAsset from "@/assets/stretching.jpg.asset.json";

const moduleAssets = {
  bp: bloodPressureAsset.url,
  tanita: bodyCompositionAsset.url,
  grip: handGripAsset.url,
  sitreach: stretchingAsset.url,
} as const;

const dashboardOrder = ["bp", "tanita", "grip", "sitreach"] as const;

export function Dashboard() {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const orderedModules = useMemo(
    () => dashboardOrder.map((id) => MODULES.find((m) => m.id === id)).filter((m) => m != null),
    [],
  );

  const clearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearAllHealthData();
    setConfirmingClear(false);
    toast.success("已清除此裝置上的所有健康紀錄。");
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <header className="text-center">
        <p className="text-lg text-muted-foreground">本地優先・資料只存在此裝置</p>
        <h1 className="font-display mt-2 text-4xl font-bold sm:text-5xl">健康紀錄簿</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          選擇需要記錄的項目：血壓、身體成份分析儀、手握力或坐地前伸測試。
        </p>
      </header>

      <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="健康模組">
        {orderedModules.map((m) => (
          <Link
            key={m.id}
            to={m.path}
            className="group grid min-h-44 grid-cols-[7rem_1fr] items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5 sm:grid-cols-[9rem_1fr]"
          >
            <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted p-2">
              <img src={moduleAssets[m.id]} alt="" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-xl font-semibold">{m.title}</span>
              <span className="block text-base text-muted-foreground">{m.subtitle}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section className="mt-8 border-t border-border pt-7">
        <h2 className="text-xl font-semibold">數據與報告</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-14 rounded-xl px-6 text-lg font-semibold">
            <Link to="/summary"><FileText className="size-5" /> 健康摘要</Link>
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={exportAllToCsv} className="min-h-14 rounded-xl px-6 text-lg font-semibold">
            <Download className="size-5" /> 匯出 CSV
          </Button>
          <Button type="button" variant={confirmingClear ? "destructive" : "outline"} size="lg" onClick={clearAll} className="min-h-14 rounded-xl px-6 text-lg font-semibold">
            <Trash2 className="size-5" />
            {confirmingClear ? "再按一次確認清除全部" : "清除所有資料"}
          </Button>
        </div>
      </section>

      <footer className="mt-10"><PrivacyNotice context="dashboard" /></footer>
    </main>
  );
}