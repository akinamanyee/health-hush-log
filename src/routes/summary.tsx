import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import {
  AI_DAILY_LIMIT,
  bumpAiUsage,
  getAiUsageToday,
  STORAGE_KEYS,
  useLocalData,
  type HealthEntry,
  type Profile,
} from "@/lib/health/store";
import { generateHealthSummary } from "@/lib/health/ai.functions";
import { gradeAgainstNorms, gradeBloodPressure, GRIP_NORMS, SIT_REACH_NORMS } from "@/lib/health/charts";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "健康摘要 — 健康紀錄簿" },
      { name: "description", content: "根據您的近期紀錄與內置參考資料生成的健康摘要，僅供參考。" },
      { property: "og:title", content: "健康摘要 — 健康紀錄簿" },
      { property: "og:description", content: "根據內置參考資料生成的健康摘要，僅供參考。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Summary,
});

function readEntries(key: string): HealthEntry[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    return (JSON.parse(raw) as { v: number; data: HealthEntry[] }).data ?? [];
  } catch {
    return [];
  }
}

function Summary() {
  const { data: profile } = useLocalData<Profile>(STORAGE_KEYS.profile, { age: null, gender: null });
  const run = useServerFn(generateHealthSummary);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (getAiUsageToday() >= AI_DAILY_LIMIT) {
      toast.error("今日 AI 使用次數已達上限，請明天再試。");
      return;
    }
    setBusy(true);
    try {
      const entries = MODULES.flatMap((m) =>
        readEntries(m.storageKey)
          .slice(0, 15)
          .map((e) => {
            let grade = "—";
            const sys = e.values["systolic"];
            const dia = e.values["diastolic"];
            const grip = e.values["grip"];
            const dist = e.values["distance"];
            if (m.id === "bp" && sys != null && dia != null) {
              grade = gradeBloodPressure(sys, dia).label;
            } else if (m.id === "grip" && grip != null && profile.age != null && profile.gender != null) {
              grade = gradeAgainstNorms(GRIP_NORMS, grip, profile.age, profile.gender);
            } else if (m.id === "sitreach" && dist != null && profile.age != null && profile.gender != null) {
              grade = gradeAgainstNorms(SIT_REACH_NORMS, dist, profile.age, profile.gender);
            }
            return { module: m.title, date: e.date, grade, values: e.values };
          }),
      );
      bumpAiUsage();
      const res = await run({ data: { entries: entries.slice(0, 60), age: profile.age, gender: profile.gender } });
      setSummary(res.summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> 返回主頁
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">健康摘要</h1>
      <p className="mt-1 text-lg text-muted-foreground">
        摘要只根據內置參考資料與您的紀錄生成，僅供參考，不能取代醫生診斷。
      </p>

      <section className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
          {busy ? "正在生成⋯" : "生成健康摘要"}
        </button>

        {summary && (
          <article className="mt-6 whitespace-pre-line rounded-2xl border border-border bg-card p-6 text-lg leading-relaxed">
            {summary}
          </article>
        )}
      </section>
    </div>
  );
}
