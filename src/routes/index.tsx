import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import { STORAGE_KEYS, clearAllHealthData, useLocalData, type Profile } from "@/lib/health/store";
import { exportAllToCsv } from "@/lib/health/csv";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "健康紀錄簿 — 本地優先健康日誌" },
      {
        name: "description",
        content: "記錄體脂、血壓、握力與柔軟度，按官方參考標準評級，資料只存在您的裝置上。",
      },
      { property: "og:title", content: "健康紀錄簿 — 本地優先健康日誌" },
      {
        property: "og:description",
        content: "記錄體脂、血壓、握力與柔軟度，按官方參考標準評級，資料只存在您的裝置上。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: profile, save: saveProfile, hydrated } = useLocalData<Profile>(STORAGE_KEYS.profile, {
    age: null,
    gender: null,
  });
  const [confirmingClear, setConfirmingClear] = useState(false);

  const clearAll = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clearAllHealthData();
    setConfirmingClear(false);
    toast.success("已清除此裝置上的所有健康紀錄。");
    window.location.reload();
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <header className="text-center">
        <p className="text-lg text-muted-foreground">本地優先・資料只存在此裝置</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-wide sm:text-5xl">健康紀錄簿</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          記錄體脂、血壓、握力與柔軟度，按參考標準即時評級。
        </p>
      </header>

      <section className="glass-card mt-10 rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold">關於您（只用於評級，保存在此裝置）</h2>
        {!hydrated ? (
          <div className="mt-4 h-16 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-base font-medium">年齡</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                value={profile.age ?? ""}
                onChange={(e) =>
                  saveProfile((p) => ({ ...p, age: e.target.value ? parseInt(e.target.value, 10) : null }))
                }
                className="mt-1 min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg"
              />
            </div>
            <div>
              <label className="text-base font-medium">性別</label>
              <div className="mt-1 flex gap-2">
                {(
                  [
                    ["male", "男"],
                    ["female", "女"],
                  ] as const
                ).map(([g, label]) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => saveProfile((p) => ({ ...p, gender: g }))}
                    className={`min-h-14 flex-1 rounded-xl border text-lg font-medium transition-colors ${
                      profile.gender === g
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="健康模組">
        {MODULES.map((m) => (
          <Link
            key={m.id}
            to={m.path}
            className="glass-card group flex items-center gap-4 rounded-3xl p-6 transition-transform hover:-translate-y-0.5"
          >
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <m.icon className="size-7" />
            </span>
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
          <Link
            to="/summary"
            className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground hover:opacity-90"
          >
            <FileText className="size-5" /> 健康摘要
          </Link>
          <button
            type="button"
            onClick={exportAllToCsv}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-6 text-lg font-semibold hover:bg-secondary"
          >
            <Download className="size-5" /> 匯出 CSV
          </button>
          <button
            type="button"
            onClick={clearAll}
            className={`inline-flex min-h-14 items-center gap-2 rounded-xl border px-6 text-lg font-semibold transition-colors ${
              confirmingClear
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Trash2 className="size-5" />
            {confirmingClear ? "再按一次確認清除全部" : "清除所有資料"}
          </button>
        </div>
      </section>

      <footer className="mt-10 space-y-2 text-center text-base text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="size-5" />
          所有健康資料只儲存在此裝置的瀏覽器內；清除瀏覽器資料會同時刪除紀錄。
        </p>
        <p>本應用程式內容僅供參考，不能取代醫生診斷。</p>
      </footer>
    </div>
  );
}
