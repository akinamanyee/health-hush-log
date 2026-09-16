import { useCallback, useEffect, useState } from "react";
import type { Gender } from "./charts";

// Local-first: every entry lives only in this browser's localStorage.
// Versioned envelope so future field additions migrate instead of wiping.

export interface HealthEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  values: Record<string, number>;
  note?: string | undefined;
  createdAt: number;
}

export interface Profile {
  age: number | null;
  gender: Gender | null;
}

const VERSION = 1;

type Envelope<T> = { v: number; data: T };

function readEnvelope<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed?.v !== VERSION || parsed.data == null) return fallback;
    return parsed.data;
  } catch {
    return fallback;
  }
}

function writeEnvelope<T>(key: string, data: T) {
  window.localStorage.setItem(key, JSON.stringify({ v: VERSION, data } satisfies Envelope<T>));
}

export const STORAGE_KEYS = {
  profile: "hlb:profile",
  tanita: "hlb:tanita",
  bp: "hlb:bp",
  grip: "hlb:grip",
  sitreach: "hlb:sitreach",
  aiUsage: "hlb:ai-usage",
} as const;

export function useLocalData<T>(key: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(readEnvelope(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = useCallback(
    (next: T | ((prev: T) => T)) => {
      setData((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeEnvelope(key, value);
        return value;
      });
    },
    [key],
  );

  return { data, save, hydrated };
}

export function makeEntry(values: Record<string, number>, date?: string, note?: string): HealthEntry {
  return {
    id: crypto.randomUUID(),
    date: date ?? new Date().toISOString().slice(0, 10),
    values,
    note,
    createdAt: Date.now(),
  };
}

export function sortEntries(entries: HealthEntry[]): HealthEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

// Best-effort daily AI usage cap (per device — the app has no accounts).
export const AI_DAILY_LIMIT = 20;

export function getAiUsageToday(): number {
  const data = readEnvelope<{ day: string; count: number }>(STORAGE_KEYS.aiUsage, { day: "", count: 0 });
  const today = new Date().toISOString().slice(0, 10);
  return data.day === today ? data.count : 0;
}

export function bumpAiUsage(): number {
  const today = new Date().toISOString().slice(0, 10);
  const current = getAiUsageToday();
  writeEnvelope(STORAGE_KEYS.aiUsage, { day: today, count: current + 1 });
  return current + 1;
}

export function clearAllHealthData() {
  Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
}
