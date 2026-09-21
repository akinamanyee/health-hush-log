import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import { clearAllHealthData } from "@/lib/health/store";
import { exportAllToCsv } from "@/lib/health/csv";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "./PrivacyNotice";
const moduleAssets = {
  bp: "/images/bloodpressure.jpg",
  tanita: "/images/scale.jpg",
  grip: "/images/handgrip.jpg",
  sitreach: "/images/stretching.jpg",
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
        <p className="mx-auto mt-3 max-w-md text-lg text-foreground/75">
          請選擇要記錄的項目。
        </p>
      </header>

      <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="健康模組">
        {orderedModules.map((m) => (
          <Link
            key={m.id}
            to={m.path}
            className="group grid min-h-40 grid-cols-[6rem_1fr] items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5 sm:min-h-44 sm:grid-cols-[8.5rem_1fr] sm:gap-5"
          >
            <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted p-2">
              <img src={moduleAssets[m.id]} alt="" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-xl font-semibold">{m.title}</span>
              <span className="block text-base text-foreground/70">{m.subtitle}</span>
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
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="text-lg font-semibold">清除資料</h2>
        <p className="mt-1 text-base text-foreground/70">
          清除後此裝置上的所有紀錄將無法復原，建議先匯出 CSV。
        </p>
        <Button
          type="button"
          variant={confirmingClear ? "destructive" : "outline"}
          size="lg"
          onClick={clearAll}
          className="mt-4 min-h-14 rounded-xl px-6 text-lg font-semibold"
        >
          <Trash2 className="size-5" />
          {confirmingClear ? "再按一次確認清除全部" : "清除所有資料"}
        </Button>
      </section>

      <footer className="mt-10"><PrivacyNotice context="dashboard" /></footer>
    </main>
  );
}