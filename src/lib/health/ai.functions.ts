import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { z } from "zod";
import { REFERENCE_LEAFLET } from "./charts";

const ExtractInput = z.object({
  image: z.string().startsWith("data:image/"), // base64 data URL, real MIME type
  module: z.enum(["tanita", "bp"]),
});

const TANITA_SCHEMA = z.object({
  weight: z.number().nullable(),
  bodyFat: z.number().nullable(),
  muscleMass: z.number().nullable(),
  bmi: z.number().nullable(),
  visceralFat: z.number().nullable(),
});

const BP_SCHEMA = z.object({
  systolic: z.number().nullable(),
  diastolic: z.number().nullable(),
  pulse: z.number().nullable(),
});

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 未能讀取圖片，請改用手動輸入。");
  return JSON.parse(match[0]);
}

export const extractFromImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }) => {
    const { createGateway, serverCapOk } = await import("@/lib/ai-gateway.server");
    const req = getRequest();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    if (!serverCapOk(ip)) throw new Error("今日讀取次數已達上限，請明天再試或手動輸入。");

    const gateway = createGateway();
    const fields =
      data.module === "tanita"
        ? "weight（體重 kg）、bodyFat（體脂率 %）、muscleMass（肌肉量 kg）、bmi、visceralFat（內臟脂肪等級）"
        : "systolic（收縮壓 mmHg）、diastolic（舒張壓 mmHg）、pulse（脈搏）";

    // Streaming on the wire; consumed server-side for a one-shot result.
    const result = streamText({
      model: gateway.responses("openai/gpt-6-astra"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `這是一張健康儀器屏幕的照片。請讀取以下數值：${fields}。只輸出一個 JSON 物件，鍵名用英文，讀不到的數值用 null，不要輸出任何其他文字。`,
            },
            { type: "image", image: data.image },
          ],
        },
      ],
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const text = await result.text;
    try {
      const schema = data.module === "tanita" ? TANITA_SCHEMA : BP_SCHEMA;
      return { ok: true as const, values: schema.parse(extractJson(text)) };
    } catch {
      throw new Error("AI 未能清楚讀取圖片，請拍清楚一點再試，或手動輸入。");
    }
  });

// Grade labels only. No raw readings, no dates, no age, no gender ever leave the device.
const SummaryInput = z.object({
  items: z
    .array(
      z.object({
        module: z.string().max(20),
        grades: z.array(z.string().max(40)).max(12),
      }),
    )
    .max(8),
});

export const generateHealthSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const { createGateway, serverCapOk } = await import("@/lib/ai-gateway.server");
    const req = getRequest();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    if (!serverCapOk(ip)) throw new Error("今日生成次數已達上限，請明天再試。");

    const gateway = createGateway();
    const records = data.items
      .filter((i) => i.grades.length > 0)
      .map((i) => `${i.module}｜近期評級（由新至舊）：${i.grades.join("、")}`)
      .join("\n");

    const result = streamText({
      model: gateway.responses("openai/gpt-6-astra"),
      messages: [
        {
          role: "user",
          content: `你是一份健康紀錄的摘要助手。以下參考資料是你唯一可以使用的知識來源，絕對不可加入參考資料以外的醫學資訊、診斷或建議；如紀錄涉及資料以外的事項，請明確說明「此部分超出參考資料範圍」。你只會看到評級結果，不會看到具體數值，請不要猜測或編造任何數值。\n\n【參考資料】\n${REFERENCE_LEAFLET}\n\n【近期評級】\n${records || "（暫無紀錄）"}\n\n請用繁體中文寫一段約150–250字的溫和健康摘要：先總結各項評級，再按參考資料給予一般性建議，最後提醒這僅供參考、不能取代醫生診斷。語氣溫和，適合50歲以上讀者。`,
        },
      ],
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const text = (await result.text).trim();
    if (!text) throw new Error("未能生成摘要，請稍後再試。");
    return { ok: true as const, summary: text };
  });
