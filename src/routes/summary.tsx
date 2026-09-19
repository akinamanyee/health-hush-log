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
  readEntries,
} from "@/lib/health/store";
import { generateHealthSummary } from "@/lib/health/ai.functions";
import { gradeEntry } from "@/lib/health/grade";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "@/components/health/PrivacyNotice";

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

function Summary() {
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
      // Only grade labels are sent — readings and dates stay on this device.
      const items = MODULES.map((m) => ({
        module: m.title,
        grades: readEntries(m.storageKey)
          .slice(0, 6)
          .flatMap((e) =>
            gradeEntry(m, e.values).map((g) => (g.metric ? `${g.metric}：${g.label}` : g.label)),
          )
          .slice(0, 12),
      })).filter((i) => i.grades.length > 0);

      if (items.length === 0) {
        toast.error("暫無紀錄可摘要，請先新增至少一筆紀錄。");
        return;
      }

      const res = await run({ data: { items } });
      setSummary(res.summary);
      bumpAiUsage();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/logbook" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> 返回健康紀錄簿
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">健康摘要</h1>
      <p className="mt-1 text-lg text-muted-foreground">
        摘要只根據內置參考資料與您的評級生成，僅供參考，不能取代醫生診斷。
      </p>

      <section className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
        <Button
          type="button"
          onClick={generate}
          disabled={busy}
          size="lg"
          className="min-h-14 rounded-xl px-6 text-lg font-semibold"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
          {busy ? "正在生成⋯" : "生成健康摘要"}
        </Button>

        {summary && (
          <article className="mt-6 whitespace-pre-line rounded-2xl border border-border bg-card p-6 text-lg leading-relaxed">
            {summary}
          </article>
        )}
      </section>

      <footer className="mt-8">
        <PrivacyNotice context="summary" />
      </footer>
    </div>
  );
}
