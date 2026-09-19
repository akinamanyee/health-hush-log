import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { streamText } from "ai";
import { z } from "zod";
import { REFERENCE_LEAFLET } from "./charts";

const ExtractInput = z.object({
  image: z.string().startsWith("data:image/"), // base64 data URL, real MIME type
  module: z.enum(["tanita", "bp", "grip", "sitreach"]),
});

const TANITA_SCHEMA = z.object({
  weight: z.number().nullable(),
  bodyFat: z.number().nullable(),
  muscleMass: z.number().nullable(),
  bmi: z.number().nullable(),
  visceralFat: z.number().nullable(),
  fatMass: z.number().nullable(),
  muscleRatio: z.number().nullable(),
  bodyWaterPct: z.number().nullable(),
  bodyWaterKg: z.number().nullable(),
  bmrKcal: z.number().nullable(),
  bmrKj: z.number().nullable(),
  fatTrunk: z.number().nullable(),
  fatArmR: z.number().nullable(),
  fatArmL: z.number().nullable(),
  fatLegR: z.number().nullable(),
  fatLegL: z.number().nullable(),
  muscleTrunk: z.number().nullable(),
  muscleArmR: z.number().nullable(),
  muscleArmL: z.number().nullable(),
  muscleLegR: z.number().nullable(),
  muscleLegL: z.number().nullable(),
});

const BP_SCHEMA = z.object({
  systolic: z.number().nullable(),
  diastolic: z.number().nullable(),
  pulse: z.number().nullable(),
});

const GRIP_SCHEMA = z.object({ grip: z.number().nullable() });
const SIT_REACH_SCHEMA = z.object({ distance: z.number().nullable() });

const EXTRACTION_FIELDS = {
  tanita: "weight（體重 kg）、bodyFat（體脂率 %）、muscleMass（肌肉量 kg）、bmi、visceralFat（內臟脂肪等級）、fatMass（體脂量 kg）、muscleRatio（肌肉比率 %）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）、fatTrunk（軀幹脂肪率 %）、fatArmR（右臂脂肪率 %）、fatArmL（左臂脂肪率 %）、fatLegR（右腿脂肪率 %）、fatLegL（左腿脂肪率 %）、muscleTrunk（軀幹肌肉量 kg）、muscleArmR（右臂肌肉量 kg）、muscleArmL（左臂肌肉量 kg）、muscleLegR（右腿肌肉量 kg）、muscleLegL（左腿肌肉量 kg）",
  bp: "systolic（收縮壓 mmHg）、diastolic（舒張壓 mmHg）、pulse（脈搏）",
  grip: "grip（手握力 kg）",
  sitreach: "distance（坐地前伸距離 cm，可為負數）",
} as const;

const EXTRACTION_SCHEMAS = {
  tanita: TANITA_SCHEMA,
  bp: BP_SCHEMA,
  grip: GRIP_SCHEMA,
  sitreach: SIT_REACH_SCHEMA,
};

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
    const fields = EXTRACTION_FIELDS[data.module];

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
      const schema = EXTRACTION_SCHEMAS[data.module];
      return { ok: true as const, values: schema.parse(extractJson(text)) };
    } catch {
      throw new Error("AI 未能清楚讀取圖片，請拍清楚一點再試，或手動輸入。");
    }
  });

// Grade labels only. No raw readings or dates ever leave the device; age/gender are not collected.
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

/**
 * Grounding check, run AFTER generation — the prompt alone cannot guarantee it.
 * Every number in the summary must already exist in the bundled leaflet (the
 * only permitted knowledge source), and the medical disclaimer must be present.
 */
function groundingFailure(text: string, allowedNumbers: Set<string>): string | null {
  if (!text) return "空白摘要";
  const numbers = text.match(/\d+(?:\.\d+)?/g) ?? [];
  const invented = numbers.filter((n) => !allowedNumbers.has(n));
  if (invented.length > 0) return `出現參考資料以外的數值：${invented.slice(0, 5).join("、")}`;
  if (!text.includes("醫生")) return "缺少就醫提醒";
  return null;
}

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

    const allowedNumbers = new Set(REFERENCE_LEAFLET.match(/\d+(?:\.\d+)?/g) ?? []);

    const basePrompt = `你是一份健康紀錄的摘要助手。以下參考資料是你唯一可以使用的知識來源，絕對不可加入參考資料以外的醫學資訊、診斷或建議；如紀錄涉及資料以外的事項，請明確說明「此部分超出參考資料範圍」。你只會看到評級結果，不會看到具體數值，請不要猜測或編造任何數值。\n\n【參考資料】\n${REFERENCE_LEAFLET}\n\n【近期評級】\n${records || "（暫無紀錄）"}\n\n請用繁體中文寫一段約150–250字的溫和健康摘要：先總結各項評級，再按參考資料給予一般性建議，最後提醒這僅供參考、不能取代醫生診斷（須出現「醫生」二字）。語氣溫和，適合50歲以上讀者。`;

    const run = async (prompt: string) => {
      const result = streamText({
        model: gateway.responses("openai/gpt-6-astra"),
        messages: [{ role: "user", content: prompt }],
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      return (await result.text).trim();
    };

    let text = await run(basePrompt);
    let failure = groundingFailure(text, allowedNumbers);
    if (failure) {
      // One strict retry, then fail loudly — never show ungrounded advice.
      text = await run(
        `${basePrompt}\n\n【重要】上一次生成不合規（原因：${failure}）。請完全不要寫出任何參考資料沒有出現過的數字，並必須提醒不能取代醫生診斷。`,
      );
      failure = groundingFailure(text, allowedNumbers);
    }
    if (failure) {
      throw new Error(`摘要未通過內容核對（${failure}），已停止顯示。請稍後再試或參考各項評級。`);
    }

    return { ok: true as const, summary: text };
  });

