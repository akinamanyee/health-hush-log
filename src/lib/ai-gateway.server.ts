import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createGateway() {
  const apiKey = process.env["GOOGLE_AI_API_KEY"];
  if (!apiKey) throw new Error("Missing GOOGLE_AI_API_KEY");
  return createGoogleGenerativeAI({ apiKey });
}

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
