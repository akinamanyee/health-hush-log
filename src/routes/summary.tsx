import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2, Heart, Activity, Scale, Eye, Hand, StretchHorizontal } from "lucide-react";
import { toast } from "sonner";
import { MODULES } from "@/lib/health/modules";
import {
  AI_DAILY_LIMIT,
  bumpAiUsage,
  getAiUsageToday,
  readEntries,
} from "@/lib/health/store";
import { generateRichSummary, type RichSummaryResult } from "@/lib/health/ai.functions";
import { agenciesForTopic } from "@/lib/health/charts";
import { formatChineseDate } from "@/lib/health/calendar";
import { interpretCard, type CardInterpretation } from "@/lib/health/grade";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "@/components/health/GradeBadge";
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

const CARD_ICONS: Record<string, typeof Heart> = {
  "血壓": Activity,
  "BMI": Scale,
  "體脂率": Eye,
  "內臟脂肪": Eye,
  "手握力": Hand,
  "坐地前伸": StretchHorizontal,
};

function Summary() {
  const run = useServerFn(generateRichSummary);
  const [result, setResult] = useState<RichSummaryResult | null>(null);
  const [cardMap, setCardMap] = useState<Map<string, CardInterpretation>>(new Map());
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (getAiUsageToday() >= AI_DAILY_LIMIT) {
      toast.error("今日 AI 使用次數已達上限，請明天再試。");
      return;
    }
    setBusy(true);
    try {
      const allCards: CardInterpretation[] = [];
      for (const m of MODULES) {
        const entries = readEntries(m.storageKey);
        if (entries.length === 0) continue;
        const latest = entries[0]!;
        const cards = interpretCard(m, latest.values, latest.date);
        allCards.push(...cards);
      }

      if (allCards.length === 0) {
        toast.error("暫無紀錄可摘要，請先新增至少一筆紀錄。");
        return;
      }

      setCardMap(new Map(allCards.map((c) => [c.name, c])));
      // Explicit whitelist: only fields RichSummaryInput.cards accepts reach the wire.
      // recordedAt and tone are client-render only. HARD CONSTRAINT: dates never
      // leave the device (PRD line 50, SUCCESS network-tab checkpoint).
      const serverCards = allCards.map(({ name, value, grade, range, action, note }) => ({
        name, value, grade, range, action, note,
      }));
      const res = await run({ data: { cards: serverCards } });
      setResult(res.result);
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
        根據您的最新紀錄與內置參考資料生成，僅供參考，不能取代醫生診斷。
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

        {result && (
          <div className="mt-8 space-y-8">
            <div>
              <h2 className="text-xl font-bold">您的健康檢查解讀</h2>
              <div className="mt-4 space-y-4">
                {result.cards.map((card) => {
                  const Icon = CARD_ICONS[card.name] ?? Heart;
                  const match = cardMap.get(card.name);
                  return (
                    <div key={card.name} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-lg font-semibold">{card.name}</span>
                            {match && (
                              <>
                                <span className="text-base text-muted-foreground">{match.value}</span>
                                <GradeBadge label={match.grade} tone={match.tone} />
                              </>
                            )}
                          </div>
                          {match?.recordedAt && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatChineseDate(match.recordedAt)} 記錄
                            </p>
                          )}
                          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                            {card.interpretation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold">為您挑選的健康貼士</h2>
              {result.agencies.length > 0 && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  本節建議整理自香港特別行政區政府公開衞生資料，來源包括：
                  <span className="font-medium text-foreground">
                    {result.agencies.join("、")}
                  </span>
                  。
                </p>
              )}
              {result.tips.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-border bg-card p-4 text-base leading-relaxed text-muted-foreground">
                  本次未能為您匹配合適的貼士，請稍後再試，或直接參考各項評級的建議。
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {result.tips.map((tip, i) => {
                    const tipAgencies = agenciesForTopic(tip.topic);
                    return (
                      <li key={i} className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-base leading-relaxed">{tip.tip}</p>
                        {tipAgencies.length > 0 && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            來源：{tipAgencies.join("、")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <p className="rounded-xl border border-border bg-muted/50 p-4 text-center text-base text-muted-foreground">
              {result.disclaimer}
            </p>
          </div>
        )}
      </section>

      <footer className="mt-8">
        <PrivacyNotice context="summary" />
      </footer>
    </div>
  );
}
