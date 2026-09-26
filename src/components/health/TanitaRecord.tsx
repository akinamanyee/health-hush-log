import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
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
import { formatChineseDate } from "@/lib/health/calendar";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "./GradeBadge";
import { ImageDrop } from "./ImageDrop";
import { PrivacyNotice } from "./PrivacyNotice";
import { useRecordState } from "./useRecordState";

export function TanitaRecord({ mod }: { mod: ModuleDef }) {
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
    submit,
    remove,
    trend,
  } = useRecordState(mod);

  const screens = mod.screens!;
  const weightValue = values["weight"] ?? "";
  const seenWeight = new Set<string>();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/logbook" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-5" /> 返回健康紀錄簿
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{mod.title}</h1>
      <p className="mt-1 text-lg text-muted-foreground">{mod.subtitle}</p>

      <div className="mt-6">
        <label htmlFor="tanita-date" className="text-base font-medium">日期</label>
        <input
          id="tanita-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 min-h-14 w-full rounded-xl border border-input bg-card px-4 text-lg"
        />
      </div>

      <div className="mt-6 space-y-6">
        {screens.map((screen, idx) => {
          const screenFields = mod.fields.filter((f) => screen.fields.includes(f.key));
          const segmentalGroups = new Set(["部位脂肪率", "部位肌肉量"]);

          const mainFields = screenFields.filter((f) => !f.group || !segmentalGroups.has(f.group));
          const collapsedGroupOrder: string[] = [];
          const collapsedGroups: Record<string, typeof screenFields> = {};
          for (const f of screenFields) {
            if (!f.group || !segmentalGroups.has(f.group)) continue;
            let bucket = collapsedGroups[f.group];
            if (!bucket) { bucket = collapsedGroups[f.group] = []; collapsedGroupOrder.push(f.group); }
            bucket.push(f);
          }

          return (
            <section key={screen.id} className="glass-card rounded-3xl p-6 sm:p-8">
              <h2 className="text-xl font-semibold">
                {idx + 1}. {screen.label}
              </h2>

              <div className="mt-4">
                <ImageDrop
                  busy={busy}
                  onImage={(dataUrl) => onImage(dataUrl, screen.id)}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {mainFields.map((f) => {
                  const isWeightRepeat = f.key === "weight" && seenWeight.size > 0;
                  if (f.key === "weight") seenWeight.add(screen.id);

                  if (isWeightRepeat) {
                    return (
                      <div key={`${screen.id}-${f.key}`}>
                        <label className="text-base font-medium">
                          {f.label}
                          <span className="ml-1 text-muted-foreground">（{f.unit}）</span>
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={weightValue}
                          disabled
                          className="mt-1 min-h-14 w-full rounded-xl border border-input bg-muted px-4 text-lg text-muted-foreground"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={`${screen.id}-${f.key}`}>
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
                })}
              </div>

              {collapsedGroupOrder.map((g) => (
                <details key={g} className="mt-4 border-t border-border pt-4">
                  <summary className="cursor-pointer text-base font-semibold">{g}</summary>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {collapsedGroups[g]!.map((f) => (
                      <div key={`${screen.id}-${f.key}`}>
                        <label htmlFor={`field-${f.key}`} className="text-base font-medium">
                          {f.label}
                          {f.unit && <span className="ml-1 text-muted-foreground">（{f.unit}）</span>}
                          <span className="ml-1 text-sm text-muted-foreground">選填</span>
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
                    ))}
                  </div>
                </details>
              ))}
            </section>
          );
        })}
      </div>

      {grades.length > 0 && (
        <div className="mt-6 space-y-2">
          {grades.map((g) => (
            <div key={g.metric ?? g.label} className="flex flex-wrap items-center gap-3">
              {g.metric && <span className="text-base font-medium">{g.metric}</span>}
              <GradeBadge label={g.label} tone={g.tone} />
              {g.description && <span className="text-base text-muted-foreground">{g.description}</span>}
            </div>
          ))}
        </div>
      )}

      {(() => {
        const filledCount = mod.fields.filter((f) => {
          const raw = values[f.key];
          return raw != null && raw !== "";
        }).length;
        return filledCount > 0 ? (
          <p className="mt-4 text-center text-base text-muted-foreground">
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
                    <Button
                      type="button"
                      onClick={() => remove(e.id)}
                      aria-label="刪除此紀錄"
                      variant="ghost"
                      size="icon"
                      className="min-h-12 min-w-12 shrink-0 rounded-xl text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* M30: post-record navigation. The top-of-page back-link and this bottom nav
          serve different scroll positions — after scrolling through 歷史紀錄 the
          user's thumb is here, not up at the header. Two links (returns + summary)
          honour USER JOURNEY 5 and 7 at the natural post-save touchpoint. */}
      <nav aria-label="下一步" className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-6 sm:gap-10">
        <Link
          to="/logbook"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" aria-hidden="true" /> 返回健康紀錄簿
        </Link>
        <Link
          to="/summary"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FileText className="size-5" aria-hidden="true" /> 查看健康摘要
        </Link>
      </nav>

      <footer className="mt-8">
        <PrivacyNotice context="module" />
      </footer>
    </div>
  );
}
