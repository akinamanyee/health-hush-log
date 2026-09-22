import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info, Trash2 } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModuleDef } from "@/lib/health/modules";
import { gradeEntry } from "@/lib/health/grade";
import { formatChineseDate, downloadIcs, googleCalendarUrl } from "@/lib/health/calendar";
import { toIsoDate } from "@/lib/health/dates";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GradeBadge } from "./GradeBadge";
import { ImageDrop } from "./ImageDrop";
import { PrivacyNotice } from "./PrivacyNotice";
import { VoiceButton } from "./VoiceButton";
import { useRecordState } from "./useRecordState";

export function RecordModule({ mod }: { mod: ModuleDef }) {
  const {
    entries,
    hydrated,
    date,
    setDate,
    values,
    setValues,
    busy,
    errors,
    grades,
    onImage,
    onVoice,
    submit,
    remove,
    setSelectedId,
    saved,
    savedTier,
    recheck,
    trend,
  } = useRecordState(mod);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/logbook" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> 返回健康紀錄簿
      </Link>
      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-3xl font-bold sm:text-4xl">{mod.title}</h1>
        {mod.infoText && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="關於此測試"
                className="inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="size-6" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-[min(calc(100vw-2rem),24rem)] rounded-2xl border bg-card/80 p-5 shadow-lg backdrop-blur-xl"
            >
              <p className="text-base leading-relaxed">{mod.infoText.intro}</p>
              <ul className="mt-3 space-y-2">
                {mod.infoText.points.map((pt) => (
                  <li key={pt.label} className="text-base leading-relaxed">
                    <strong>{pt.label}</strong>{pt.text}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">{mod.infoText.note}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>
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
            <ImageDrop busy={busy} onImage={(dataUrl) => onImage(dataUrl)} />
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
              let bucket = groups[f.group];
              if (!bucket) { bucket = groups[f.group] = []; groupOrder.push(f.group); }
              bucket.push(f);
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
                  const fields = groups[g]!;
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
