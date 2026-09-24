import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

// Static reference table from TANITA 「身體組成數據參考指標」 — the same
// classification the user's own 身體組成分析儀 displays. Gender/age labels
// here are INTENTIONAL per ADR 0025 — this is static authoritative reference
// material, not AI-generated advice. Do NOT remove under the sensitive-word
// rule (ADR 0024 applies to AI output only). AI grounding for 體脂率 tips
// continues to source from HA (醫管局) via TIPS_REFERENCE; the two sources
// may diverge — see ADR 0025 Source change history.
const TANITA_AGE_BUCKETS = ["18-39歲", "40-59歲", "≥60歲"] as const;
const TANITA_TIERS = ["消瘦", "標準健康型", "標準警戒型", "微胖", "肥胖"] as const;

type BodyFatMatrix = Record<
  (typeof TANITA_TIERS)[number],
  Record<(typeof TANITA_AGE_BUCKETS)[number], string>
>;

const BODY_FAT_MALE: BodyFatMatrix = {
  "消瘦":       { "18-39歲": "<10%",  "40-59歲": "<11%",  "≥60歲": "<13%" },
  "標準健康型": { "18-39歲": "10-20%", "40-59歲": "11-21%", "≥60歲": "13-24%" },
  "標準警戒型": { "18-39歲": "21-23%", "40-59歲": "22-24%", "≥60歲": "25-27%" },
  "微胖":       { "18-39歲": "24-27%", "40-59歲": "25-28%", "≥60歲": "28-30%" },
  "肥胖":       { "18-39歲": "≥28%",  "40-59歲": "≥29%",  "≥60歲": "≥31%" },
};

const BODY_FAT_FEMALE: BodyFatMatrix = {
  "消瘦":       { "18-39歲": "<20%",  "40-59歲": "<21%",  "≥60歲": "<22%" },
  "標準健康型": { "18-39歲": "20-27%", "40-59歲": "21-28%", "≥60歲": "22-29%" },
  "標準警戒型": { "18-39歲": "28-34%", "40-59歲": "29-35%", "≥60歲": "30-36%" },
  "微胖":       { "18-39歲": "35-39%", "40-59歲": "36-40%", "≥60歲": "37-41%" },
  "肥胖":       { "18-39歲": "≥40%",  "40-59歲": "≥41%",  "≥60歲": "≥42%" },
};

function BodyFatMatrixTable({ title, data }: { title: string; data: BodyFatMatrix }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-center">
        <caption className="mb-2 text-xs text-muted-foreground">{title}</caption>
        <thead>
          <tr className="border-b border-border">
            <th className="p-2 text-left font-medium text-foreground"></th>
            {TANITA_AGE_BUCKETS.map((age) => (
              <th key={age} className="p-2 font-medium text-foreground">{age}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TANITA_TIERS.map((tier) => (
            <tr key={tier} className="border-b border-border/50 last:border-b-0">
              <td className="p-2 text-left font-medium text-foreground">{tier}</td>
              {TANITA_AGE_BUCKETS.map((age) => (
                <td key={age} className="p-2 text-muted-foreground">{data[tier][age]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BodyFatStandardTable() {
  return (
    <details className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">
        查看標準脂肪量對照表（TANITA）
      </summary>
      <BodyFatMatrixTable title="男性 標準脂肪量（%）" data={BODY_FAT_MALE} />
      <BodyFatMatrixTable title="女性 標準脂肪量（%）" data={BODY_FAT_FEMALE} />
      <p className="mt-3 text-xs text-muted-foreground">
        資料來源：TANITA〈身體組成數據參考指標〉。體脂率標準因性別及年齡而異，本應用程式因不收集性別及年齡而不進行分級，用家可對照上表自行參考。
      </p>
    </details>
  );
}

interface PreviewItem {
  moduleId: string;
  moduleTitle: string;
  hasEntry: boolean;
  latestDate?: string;
  cardCount: number;
  tanitaMetrics?: string[];
}

function Summary() {
  const run = useServerFn(generateRichSummary);
  const [result, setResult] = useState<RichSummaryResult | null>(null);
  const [cardMap, setCardMap] = useState<Map<string, CardInterpretation>>(new Map());
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[] | null>(null);
  const [usageToday, setUsageToday] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    // Mirrors the generate flow's exact source (readEntries + interpretCard)
    // so preview and generation can never disagree about what the summary
    // will contain. Runs on mount and after each successful generate.
    const items: PreviewItem[] = MODULES.map((mod) => {
      const entries = readEntries(mod.storageKey);
      const latest = entries[0];
      if (!latest) {
        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          hasEntry: false,
          cardCount: 0,
        };
      }
      const cards = interpretCard(mod, latest.values, latest.date);
      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        hasEntry: true,
        latestDate: latest.date,
        cardCount: cards.length,
        ...(mod.id === "tanita" ? { tanitaMetrics: cards.map((c) => c.name) } : {}),
      };
    });
    setPreview(items);
    setUsageToday(getAiUsageToday());
  }, [refreshTick]);

  const includedItems = preview?.filter((p) => p.cardCount > 0) ?? [];
  const recordedButEmpty = preview?.filter((p) => p.hasEntry && p.cardCount === 0) ?? [];
  const missingItems = preview?.filter((p) => !p.hasEntry) ?? [];
  const capReached = usageToday != null && usageToday >= AI_DAILY_LIMIT;
  const nothingToSummarize = preview != null && includedItems.length === 0;

  const buttonLabel = busy
    ? "正在生成⋯"
    : capReached
      ? "今日已達上限"
      : nothingToSummarize
        ? "尚未紀錄任何可摘要項目"
        : "生成健康摘要";

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
      setRefreshTick((t) => t + 1);
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
        {preview != null && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground">
              本摘要根據您每個項目的最新一次紀錄。未曾記錄的項目不會出現。
            </p>

            {includedItems.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-foreground">本次將包含：</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {includedItems.map((item) => (
                    <li key={item.moduleId}>
                      <span className="font-medium text-foreground">{item.moduleTitle}</span>
                      {item.latestDate && (
                        <>
                          {" · "}
                          {formatChineseDate(item.latestDate)} 記錄
                        </>
                      )}
                      {item.tanitaMetrics && item.tanitaMetrics.length > 0 && (
                        <>（含 {item.tanitaMetrics.join("、")}）</>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recordedButEmpty.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-foreground">已紀錄但未含可評級指標（不會出現於摘要）：</p>
                <p className="mt-1 text-muted-foreground">
                  {recordedButEmpty.map((i) => i.moduleTitle).join("、")}
                </p>
              </div>
            )}

            {missingItems.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-foreground">未曾記錄（不會包含）：</p>
                <p className="mt-1 text-muted-foreground">
                  {missingItems.map((i) => i.moduleTitle).join("、")}
                </p>
              </div>
            )}

            {usageToday != null && (
              <p className="mt-3 text-muted-foreground">
                今日 AI 生成剩餘 <span className="font-medium text-foreground">{Math.max(0, AI_DAILY_LIMIT - usageToday)} / {AI_DAILY_LIMIT}</span> 次
              </p>
            )}
          </div>
        )}

        <Button
          type="button"
          onClick={generate}
          disabled={busy || capReached || nothingToSummarize}
          size="lg"
          className="min-h-14 rounded-xl px-6 text-lg font-semibold"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
          {buttonLabel}
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
                          {card.name === "體脂率" && <BodyFatStandardTable />}
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
