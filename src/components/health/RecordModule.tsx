import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModuleDef } from "@/lib/health/modules";
import {
  makeEntry,
  sortEntries,
  useLocalData,
  getAiUsageToday,
  bumpAiUsage,
  AI_DAILY_LIMIT,
  type HealthEntry,
} from "@/lib/health/store";
import { extractFromImage } from "@/lib/health/ai.functions";
import { gradeBloodPressure } from "@/lib/health/charts";
import { gradeEntry } from "@/lib/health/grade";
import { formatChineseDate, recheckDate, downloadIcs, googleCalendarUrl } from "@/lib/health/calendar";
import { todayIso, toIsoDate } from "@/lib/health/dates";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "./GradeBadge";
import { ImageDrop } from "./ImageDrop";
import { PrivacyNotice } from "./PrivacyNotice";
import { VoiceButton } from "./VoiceButton";

export function RecordModule({ mod }: { mod: ModuleDef }) {
  const { data: entries, save, hydrated } = useLocalData<HealthEntry[]>(mod.storageKey, []);
  const extract = useServerFn(extractFromImage);

  const [date, setDate] = useState(() => todayIso());
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const numeric = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of mod.fields) {
      const v = parseFloat(values[f.key] ?? "");
      if (!Number.isNaN(v)) out[f.key] = v;
    }
    return out;
  }, [values, mod]);

  const grades = gradeEntry(mod, numeric);

  const onImage = async (dataUrl: string) => {
    if (getAiUsageToday() >= AI_DAILY_LIMIT) {
      toast.error("今日 AI 讀取次數已達上限，請手動輸入或明天再試。");
      return;
    }
    setBusy(true);
    try {
      const res = await extract({ data: { image: dataUrl, module: mod.id } });
      const filled: Record<string, string> = { ...values };
      for (const [k, v] of Object.entries(res.values)) {
        if (v != null) filled[k] = String(v);
      }
      setValues(filled);
      // Only a successful read counts against the daily cap.
      bumpAiUsage();
      const hasOptional = mod.fields.some((f) => f.optional);
      if (hasOptional) {
        const filledCount = mod.fields.filter((f) => filled[f.key] != null && filled[f.key] !== "").length;
        const total = mod.fields.length;
        const msg = filledCount >= total
          ? `已讀取圖片（全部 ${total} 項已填）。請核對數值後儲存。`
          : `已讀取圖片（已填 ${filledCount} / ${total} 項）。可繼續拍攝下一個畫面，或核對後儲存。`;
        toast.success(msg);
      } else {
        toast.success("已讀取圖片，請核對數值後儲存。");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "讀取失敗，請手動輸入。");
    } finally {
      setBusy(false);
    }
  };

  const onVoice = (nums: number[]) => {
    if (nums.length === 0) {
      toast.error("聽不到數字，請再試一次或手動輸入。");
      return;
    }
    const filled: Record<string, string> = { ...values };
    mod.fields.forEach((f, i) => {
      if (nums[i] != null) filled[f.key] = String(nums[i]);
    });
    setValues(filled);
    toast.success("已填入語音數值，請核對後儲存。");
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    for (const f of mod.fields) {
      const raw = values[f.key];
      const v = parseFloat(raw ?? "");
      if (raw == null || raw === "" || Number.isNaN(v)) {
        if (!f.optional) errs[f.key] = "請輸入數值";
      } else if (v < f.min || v > f.max) {
        errs[f.key] = `請輸入 ${f.min} 至 ${f.max} 之間的數值`;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const entry = makeEntry(numeric, date);
    save((prev) => sortEntries([entry, ...prev]));
    setValues({});
    setSelectedId(entry.id);
    toast.success("已儲存紀錄（只保存於此裝置）。");
  };

  const remove = (id: string) =>
    save((prev) => {
      setSelectedId((cur) => (cur === id ? null : cur));
      return prev.filter((e) => e.id !== id);
    });

  // Follow-up scheduling works for any record the user picks from history,
  // not only the one just saved.
  const saved = selectedId ? entries.find((e) => e.id === selectedId) : undefined;
  const savedSystolic = saved?.values["systolic"];
  const savedDiastolic = saved?.values["diastolic"];
  const savedTier =
    mod.id === "bp" && savedSystolic != null && savedDiastolic != null
      ? gradeBloodPressure(savedSystolic, savedDiastolic)
      : undefined;
  const recheck =
    saved && savedTier && savedTier.recheckMonths !== "urgent"
      ? recheckDate(saved.date, savedTier.recheckMonths)
      : undefined;

  const trend = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)
        .map((e) => ({ date: formatChineseDate(e.date), ...e.values })),
    [entries],
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/logbook" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> 返回健康紀錄簿
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{mod.title}</h1>
      <p className="mt-1 text-lg text-muted-foreground">{mod.subtitle}</p>

      <section className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold">新增紀錄</h2>

        <div className="mt-4">
          <label htmlFor={`${mod.id}-date`} className="text-base font-medium">日期</label>
          <input
            id={`${mod.id}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg"
          />
        </div>

        {mod.supportsImage && (
          <div className="mt-5">
            <ImageDrop busy={busy} onImage={onImage} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <VoiceButton onNumbers={onVoice} />
          <span className="text-base text-muted-foreground">或直接於下方輸入</span>
        </div>

        <div className="mt-5 space-y-6">
          {(() => {
            const fieldInput = (f: (typeof mod.fields)[number]) => (
              <div key={f.key}>
                <label htmlFor={`field-${f.key}`} className="text-base font-medium">
                  {f.label}
                  {f.unit && <span className="ml-1 text-muted-foreground">（{f.unit}）</span>}
                  {f.optional && <span className="ml-1 text-sm text-muted-foreground">選填</span>}
                </label>
                <input
                  id={`field-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  step={f.step ?? "any"}
                  min={f.min}
                  max={f.max}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="mt-1 min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg"
                  aria-invalid={Boolean(errors[f.key])}
                />
                {errors[f.key] && <p className="mt-1 text-base text-destructive">{errors[f.key]}</p>}
              </div>
            );

            const ungrouped = mod.fields.filter((f) => !f.group);
            const groupOrder: string[] = [];
            const groups: Record<string, (typeof mod.fields)[number][]> = {};
            for (const f of mod.fields) {
              if (!f.group) continue;
              if (!groups[f.group]) { groups[f.group] = []; groupOrder.push(f.group); }
              groups[f.group].push(f);
            }

            const collapsedGroups = new Set(["部位脂肪率", "部位肌肉量"]);

            return (
              <>
                {ungrouped.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ungrouped.map(fieldInput)}
                  </div>
                )}
                {groupOrder.map((g) => {
                  const fields = groups[g];
                  const content = (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fields.map(fieldInput)}
                    </div>
                  );
                  if (collapsedGroups.has(g)) {
                    return (
                      <details key={g} className="border-t border-border pt-4">
                        <summary className="cursor-pointer text-base font-semibold">{g}</summary>
                        <div className="mt-3">{content}</div>
                      </details>
                    );
                  }
                  return (
                    <div key={g} className="border-t border-border pt-4">
                      <h3 className="mb-3 text-base font-semibold">{g}</h3>
                      {content}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>

        {grades.length > 0 && (
          <div className="mt-5 space-y-2">
            {grades.map((g) => (
              <div key={g.metric ?? g.label} className="flex flex-wrap items-center gap-3">
                {g.metric && <span className="text-base font-medium">{g.metric}</span>}
                <GradeBadge label={g.label} tone={g.tone} />
                {g.description && <span className="text-base text-muted-foreground">{g.description}</span>}
              </div>
            ))}
          </div>
        )}

        {mod.fields.some((f) => f.optional) && (() => {
          const filledCount = mod.fields.filter((f) => {
            const raw = values[f.key];
            return raw != null && raw !== "";
          }).length;
          return filledCount > 0 ? (
            <p className="mt-5 text-center text-base text-muted-foreground">
              已填 {filledCount} / {mod.fields.length} 項
            </p>
          ) : null;
        })()}

        <Button
          type="button"
          onClick={submit}
          size="lg"
          className="mt-6 min-h-14 w-full rounded-xl text-lg font-semibold"
        >
          儲存紀錄
        </Button>
      </section>

      {saved && mod.id === "bp" && savedTier && (
        <section className="glass-card mt-6 rounded-3xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold">複查安排</h2>
          {savedTier.recheckMonths === "urgent" ? (
            <p className="mt-3 text-lg font-semibold text-destructive">
              此讀數屬嚴重偏高，請即時就醫。
            </p>
          ) : (
            recheck && (
              <>
                <p className="mt-3 text-lg">
                  建議於 <strong>{formatChineseDate(toIsoDate(recheck))}</strong>（約 {savedTier.recheckMonths} 個月後）再次量度血壓。
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => downloadIcs(recheck, "血壓複查提醒", "健康紀錄簿提醒您再次量度血壓。")}
                    size="lg"
                    className="min-h-14 rounded-xl text-lg font-semibold"
                  >
                    下載行事曆提醒（.ics）
                  </Button>
                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-h-14 rounded-xl text-lg font-semibold"
                  >
                    <a
                      href={googleCalendarUrl(recheck, "血壓複查提醒", "健康紀錄簿提醒您再次量度血壓。")}
                      target="_blank"
                      rel="noreferrer"
                    >
                      加入 Google 日曆
                    </a>
                  </Button>
                </div>
              </>
            )
          )}
        </section>
      )}

      <section className="glass-card mt-6 rounded-3xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold">歷史紀錄</h2>
        {!hydrated ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted" />
        ) : entries.length === 0 ? (
          <p className="mt-4 text-lg text-muted-foreground">暫無紀錄。新增第一筆吧。</p>
        ) : (
          <>
            {trend.length > 1 && (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <XAxis dataKey="date" tick={{ fontSize: 14 }} />
                    <YAxis tick={{ fontSize: 14 }} width={40} />
                    <Tooltip />
                    {mod.fields.slice(0, 3).map((f, i) => (
                      <Line
                        key={f.key}
                        type="monotone"
                        dataKey={f.key}
                        name={f.label}
                        stroke={`var(--chart-${i + 1})`}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-4 divide-y divide-border">
              {entries.map((e) => {
                const entryGrades = gradeEntry(mod, e.values);
                return (
                <li key={e.id} className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="text-lg font-medium">{formatChineseDate(e.date)}</div>
                    <div className="text-base text-muted-foreground">
                      {mod.fields
                        .filter((f) => e.values[f.key] != null)
                        .map((f) => `${f.label} ${e.values[f.key]}${f.unit}`)
                        .join("・")}
                    </div>
                    {entryGrades.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entryGrades.map((g) => (
                          <span key={g.metric ?? g.label} className="inline-flex items-center gap-2">
                            {g.metric && <span className="text-sm font-medium text-muted-foreground">{g.metric}</span>}
                            <GradeBadge label={g.label} tone={g.tone} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                  {mod.id === "bp" && e.values["systolic"] != null && e.values["diastolic"] != null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => setSelectedId(e.id)}
                      className="min-h-12 rounded-xl text-base font-medium text-primary hover:bg-secondary"
                    >
                      複查提醒
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label="刪除此紀錄"
                    variant="ghost"
                    size="icon"
                    className="min-h-12 min-w-12 rounded-xl text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-5" />
                  </Button>
                  </div>
                </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <footer className="mt-8">
        <PrivacyNotice context="module" />
      </footer>
    </div>
  );
}
