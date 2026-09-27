import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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
import { formatChineseDate, recheckDate } from "@/lib/health/calendar";
import { todayIso } from "@/lib/health/dates";

export function useRecordState(mod: ModuleDef) {
  const { data: entries, save, hydrated } = useLocalData<HealthEntry[]>(mod.storageKey, []);
  const extract = useServerFn(extractFromImage);

  const [date, setDate] = useState(() => todayIso());
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // M37: ephemeral "just-saved" flag drives the ~1.6s post-tap button state
  // (teal 「✓ 已儲存」). Fixes the M36 misread where the pre-tap teal ✓ read
  // as "saved" and users didn't tap. Now ✓ appears only after the save
  // actually happened; the pre-tap ready state uses a Save (floppy) icon
  // and 「一按儲存」 label, which is imperative not affirmative.
  const [justSaved, setJustSaved] = useState(false);

  const numeric = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of mod.fields) {
      const v = parseFloat(values[f.key] ?? "");
      if (!Number.isNaN(v)) out[f.key] = v;
    }
    return out;
  }, [values, mod]);

  const grades = gradeEntry(mod, numeric);

  // M36: ready = every required field carries a non-empty raw that parses
  // inside [min, max]. Drives the teal-when-ready button state in both
  // record page components; a passive readiness cue that lets a 50+ user
  // know the form is saveable before tapping. Post-M32 every field is
  // required so no `f.optional` gate is needed.
  const ready = useMemo(() => {
    return mod.fields.every((f) => {
      const raw = values[f.key];
      if (raw == null || raw === "") return false;
      const v = parseFloat(raw);
      if (Number.isNaN(v)) return false;
      return v >= f.min && v <= f.max;
    });
  }, [values, mod]);

  const onImage = async (dataUrl: string, screenId?: string) => {
    if (getAiUsageToday() >= AI_DAILY_LIMIT) {
      toast.error("今日 AI 讀取次數已達上限，請手動輸入或明天再試。");
      return;
    }
    setBusy(true);
    try {
      const res = await extract({
        data: { image: dataUrl, module: mod.id, screen: screenId },
      });
      const filled: Record<string, string> = { ...values };
      for (const [k, v] of Object.entries(res.values)) {
        if (v != null) filled[k] = String(v);
      }
      setValues(filled);
      bumpAiUsage();
      // M37 cleanup: post-M32 no field is optional so the previous
      // `hasOptional` branch was dead code. Single toast form now — the
      // always-visible 「已填 N / M 項」 counter above the save button
      // corroborates the count for the user.
      const filledCount = mod.fields.filter(
        (f) => filled[f.key] != null && filled[f.key] !== "",
      ).length;
      const total = mod.fields.length;
      const msg =
        filledCount >= total
          ? `已讀取圖片（全部 ${total} 項已填）。請核對數值後儲存。`
          : `已讀取圖片（已填 ${filledCount} / ${total} 項）。可繼續拍攝下一個畫面，或核對後儲存。`;
      toast.success(msg);
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
    if (Object.keys(errs).length > 0) {
      // M36: audible/visible feedback + auto-scroll to first invalid field.
      // Toast confirms the tap registered; scroll brings the field to the
      // user's thumb rather than making them hunt for red text.
      toast.error(`尚有 ${Object.keys(errs).length} 項未填或超出範圍，已標紅，請補上再儲存。`);
      queueMicrotask(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    const entry = makeEntry(numeric, date);
    save((prev) => sortEntries([entry, ...prev]));
    setValues({});
    setSelectedId(entry.id);
    toast.success("已儲存紀錄（只保存於此裝置）。");
    // M37: 1600ms reassurance beat on the save button (teal 「✓ 已儲存」)
    // so 50+ users whose eyes are on the button — not the top-of-page
    // toast — get a clear "the tap worked" signal before the button
    // reverts to navy 「儲存紀錄」 as `values` clears.
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const remove = (id: string) =>
    save((prev) => {
      setSelectedId((cur) => (cur === id ? null : cur));
      return prev.filter((e) => e.id !== id);
    });

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

  return {
    entries,
    hydrated,
    date,
    setDate,
    values,
    setValues,
    busy,
    errors,
    numeric,
    grades,
    ready,
    justSaved,
    onImage,
    onVoice,
    submit,
    remove,
    selectedId,
    setSelectedId,
    saved,
    savedTier,
    recheck,
    trend,
  };
}
