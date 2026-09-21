import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Server-only. The API key is read inside handlers and never reaches the browser.
export function createGateway() {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return createGoogleGenerativeAI({ apiKey });
}

// Coarse best-effort per-IP daily backstop cap (the app is anonymous; the
// client-side counter is the honest path, this is abuse backstop only).
const hits = new Map<string, { day: string; count: number }>();
const SERVER_DAILY_LIMIT = 200;

export function serverCapOk(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const rec = hits.get(ip);
  if (!rec || rec.day !== today) {
    hits.set(ip, { day: today, count: 1 });
    return true;
  }
  if (rec.count >= SERVER_DAILY_LIMIT) return false;
  rec.count += 1;
  return true;
}
