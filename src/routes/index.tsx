import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import { clearAllHealthData, purgeLegacyProfileData } from "@/lib/health/store";
import { exportAllToCsv } from "@/lib/health/csv";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "@/components/health/PrivacyNotice";
import bloodPressureAsset from "@/assets/bloodpressure.png.asset.json";
import bodyCompositionAsset from "@/assets/bodycomposition.png.asset.json";
import frontPageAsset from "@/assets/front-page-2.jpg.asset.json";
import handGripAsset from "@/assets/handgrip.png.asset.json";
import stretchingAsset from "@/assets/stretching.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "健康紀錄簿 — 本地優先健康日誌" },
      {
        name: "description",
        content: "記錄血壓、身體成份分析儀、手握力與坐地前伸測試讀數，資料只存在您的裝置上。",
      },
      { property: "og:title", content: "健康紀錄簿 — 本地優先健康日誌" },
      {
        property: "og:description",
        content: "從封面進入四項健康紀錄，支援拍照、上載、語音或手動輸入，資料只存在您的裝置上。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const moduleAssets = {
  bp: bloodPressureAsset.url,
  tanita: bodyCompositionAsset.url,
  grip: handGripAsset.url,
  sitreach: stretchingAsset.url,
} as const;

const dashboardOrder = ["bp", "tanita", "grip", "sitreach"] as const;

function Index() {
  const [entered, setEntered] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const orderedModules = useMemo(
    () => dashboardOrder.map((id) => MODULES.find((m) => m.id === id)).filter((m) => m != null),
    [],
  );

  useEffect(() => purgeLegacyProfileData(), []);

  const clearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearAllHealthData();
    setConfirmingClear(false);
    toast.success("已清除此裝置上的所有健康紀錄。");
    setEntered(false);
  };

  if (!entered) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto flex min-h-screen w-full flex-col items-center justify-center px-4 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEntered(true)}
            className="relative h-[calc(100svh-2.5rem)] max-h-[1920px] w-auto max-w-full overflow-hidden rounded-[2rem] border border-border bg-card p-0 shadow-2xl hover:bg-card focus-visible:ring-4"
          >
            <img
              src={frontPageAsset.url}
              alt="護心計劃，守護您的心腦血管健康"
              className="h-full w-auto max-w-full object-contain"
            />
            <span className="sr-only">護心計劃，守護您的心腦血管健康，開始檢測，進入</span>
          </Button>
          <div className="mt-5 w-full max-w-md">
            <PrivacyNotice context="cover" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <header className="text-center">
        <p className="text-lg text-muted-foreground">本地優先・資料只存在此裝置</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-wide sm:text-5xl">健康紀錄簿</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          選擇需要記錄的項目：血壓、身體成份分析儀、手握力或坐地前伸測試。
        </p>
      </header>

      <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="健康模組">
        {orderedModules.map((m) => (
          <Link
            key={m.id}
            to={m.path}
            className="glass-card group grid grid-cols-[6.5rem_1fr] items-center gap-5 rounded-3xl p-5 transition-transform hover:-translate-y-0.5 sm:grid-cols-[8rem_1fr]"
          >
            <img src={moduleAssets[m.id]} alt="" className="aspect-square w-full rounded-2xl object-cover" />
            <span>
              <span className="block text-xl font-semibold">{m.title}</span>
              <span className="block text-base text-muted-foreground">{m.subtitle}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold">數據與報告</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="lg" className="min-h-14 rounded-xl px-6 text-lg font-semibold">
            <Link to="/summary">
              <FileText className="size-5" /> 健康摘要
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => exportAllToCsv()}
            className="min-h-14 rounded-xl px-6 text-lg font-semibold"
          >
            <Download className="size-5" /> 匯出 CSV
          </Button>
          <Button
            type="button"
            variant={confirmingClear ? "destructive" : "outline"}
            size="lg"
            onClick={clearAll}
            className="min-h-14 rounded-xl px-6 text-lg font-semibold"
          >
            <Trash2 className="size-5" />
            {confirmingClear ? "再按一次確認清除全部" : "清除所有資料"}
          </Button>
        </div>
      </section>

      <footer className="mt-10">
        <PrivacyNotice context="dashboard" />
      </footer>
    </main>
  );
}
