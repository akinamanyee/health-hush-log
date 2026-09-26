import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { generateText } from "ai";
import { z } from "zod";
import { REFERENCE_LEAFLET, TIPS_REFERENCE, type TipBlock, type Agency } from "./charts";
import { MODULE_BY_ID } from "./modules";

const ExtractInput = z.object({
  image: z.string().startsWith("data:image/"), // base64 data URL, real MIME type
  module: z.enum(["tanita", "bp", "grip", "sitreach"]),
  screen: z.string().optional(),
});

const TANITA_SCHEMA = z.object({
  weight: z.number().nullable(),
  bodyFat: z.number().nullable(),
  fatMass: z.number().nullable(),
  muscleMass: z.number().nullable(),
  muscleRatio: z.number().nullable(),
  smi: z.number().nullable(),
  bodyWaterPct: z.number().nullable(),
  bodyWaterKg: z.number().nullable(),
  visceralFat: z.number().nullable(),
  bmrKcal: z.number().nullable(),
  bmrKj: z.number().nullable(),
  bmi: z.number().nullable(),
});

const BP_SCHEMA = z.object({
  systolic: z.number().nullable(),
  diastolic: z.number().nullable(),
  pulse: z.number().nullable(),
});

const GRIP_SCHEMA = z.object({ grip: z.number().nullable() });
const SIT_REACH_SCHEMA = z.object({ distance: z.number().nullable() });

const EXTRACTION_FIELDS = {
  tanita: "weight（體重 kg）、bodyFat（體脂率 %）、fatMass（體脂量 kg）、muscleMass（肌肉量 kg）、muscleRatio（肌肉比率 %）、smi（肌少症指數 kg/m²）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）、visceralFat（內臟脂肪等級）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）、bmi（BMI）",
  bp: "systolic（收縮壓 mmHg）、diastolic（舒張壓 mmHg）、pulse（脈搏）",
  grip: "grip（手握力 kg，左右手合計數值）",
  sitreach: "distance（坐地前伸距離 cm，可為負數）",
} as const;

const EXTRACTION_SCHEMAS = {
  tanita: TANITA_SCHEMA,
  bp: BP_SCHEMA,
  grip: GRIP_SCHEMA,
  sitreach: SIT_REACH_SCHEMA,
};

const TANITA_SCREENS = MODULE_BY_ID.tanita.screens!;
const TANITA_SCREEN_PROMPTS: Record<string, string> = {
  bodyFat: "weight（體重 kg）、bodyFat（體脂率 %）、fatMass（體脂量 kg）",
  muscle: "weight（體重 kg）、muscleMass（肌肉量 kg）、muscleRatio（肌肉比率 %）、smi（肌少症指數 kg/m²）",
  water: "weight（體重 kg）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）",
  visceral: "weight（體重 kg）、visceralFat（內臟脂肪等級）",
  bmr: "weight（體重 kg）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）",
  bmi: "weight（體重 kg）、bmi（BMI）",
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

    const screenMeta = data.module === "tanita" && data.screen
      ? TANITA_SCREENS.find((s) => s.id === data.screen)
      : undefined;
    const screenPrompt = screenMeta ? TANITA_SCREEN_PROMPTS[screenMeta.id] : undefined;
    const fields = screenPrompt ?? EXTRACTION_FIELDS[data.module];
    const screenHint = screenMeta
      ? `這是身體組成分析儀「${screenMeta.label}」畫面的照片。`
      : "這是一張健康儀器屏幕的照片。";

    let result;
    try {
      result = await generateText({
        model: gateway("gemini-3.6-flash"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${screenHint}請讀取以下數值：${fields}。只輸出一個 JSON 物件，鍵名用英文，讀不到的數值用 null，不要輸出任何其他文字。`,
              },
              { type: "image", image: data.image },
            ],
          },
        ],
      });
    } catch (err) {
      console.error("[extractFromImage] AI call failed:", err);
      throw new Error("圖片讀取暫時未能連線，請稍後再試或手動輸入。");
    }

    const text = result.text;
    try {
      if (screenMeta) {
        const shape: Record<string, z.ZodNullable<z.ZodNumber>> = {};
        for (const k of screenMeta.fields) shape[k] = z.number().nullable();
        const screenSchema = z.object(shape);
        return { ok: true as const, values: screenSchema.parse(extractJson(text)) };
      }
      const schema = EXTRACTION_SCHEMAS[data.module];
      return { ok: true as const, values: schema.parse(extractJson(text)) };
    } catch {
      throw new Error("AI 未能清楚讀取圖片，請拍清楚一點再試，或手動輸入。");
    }
  });

const RichSummaryInput = z.object({
  cards: z.array(z.object({
    name: z.string().max(20),
    value: z.string().max(80),
    grade: z.string().max(40),
    range: z.string().max(120),
    action: z.string().max(100),
    note: z.string().max(100).optional(),
  })).max(12),
});

const RichSummaryOutput = z.object({
  cards: z.array(z.object({
    name: z.string(),
    interpretation: z.string(),
  })),
  tips: z.array(z.object({
    tip: z.string(),
    topic: z.string(),
  })),
  disclaimer: z.string(),
});

export type RichSummaryResult = z.infer<typeof RichSummaryOutput> & {
  agencies: Agency[];
};

const SENSITIVE_LABEL_PATTERN = /男士|女士|長者|學生/;

function selectRelevantTips(cards: z.infer<typeof RichSummaryInput>["cards"]): TipBlock[] {
  const topics = new Set<string>();
  for (const card of cards) {
    const g = card.grade;
    const n = card.name;
    if (n === "血壓" && g !== "正常") {
      topics.add("心腦血管病、中風及預防");
      topics.add("高血壓及預防");
      topics.add("健康飲食（針對過重及高血壓）");
    }
    if (n === "BMI" && (g === "偏高" || g === "過高" || g === "過輕")) {
      topics.add("BMI（體重管理）");
      topics.add("健康飲食（針對過重及高血壓）");
      topics.add("日常運動（針對預防過重）");
    }
    if (n === "內臟脂肪" && g !== "正常") {
      topics.add("內臟脂肪問題與預防");
      topics.add("心腦血管病、中風及預防");
    }
    if (n === "體脂率") {
      topics.add("體脂率參考標準");
    }
    if (n === "手握力" || n === "坐地前伸") {
      topics.add("日常運動（針對預防過重）");
    }
  }
  if (topics.size === 0) {
    topics.add("健康飲食（針對過重及高血壓）");
    topics.add("日常運動（針對預防過重）");
  }
  return TIPS_REFERENCE.filter((t) => topics.has(t.topic));
}

type RawSummary = z.infer<typeof RichSummaryOutput>;

function richGroundingFailure(
  output: RawSummary,
  allowedNumbers: Set<string>,
  expectTips: boolean,
  expectedCardCount: number,
): string | null {
  const allText = [
    ...output.cards.map((c) => c.interpretation),
    ...output.tips.map((t) => t.tip),
    output.disclaimer,
  ].join(" ");
  if (!allText) return "空白摘要";
  const numbers = allText.match(/\d+(?:\.\d+)?/g) ?? [];
  const invented = numbers.filter((n) => !allowedNumbers.has(n));
  if (invented.length > 0) return `出現參考資料以外的數值：${invented.slice(0, 5).join("、")}`;
  if (SENSITIVE_LABEL_PATTERN.test(allText)) return "出現不適用的性別或群體字眼";
  if (!output.disclaimer.includes("醫生")) return "缺少就醫提醒";
  // Every tip must carry a topic that exactly matches one bundled in this
  // generation's relevantTips; the parse step drops mismatches. If we asked
  // for tips and got none through, the AI drifted on topic strings — retry.
  if (expectTips && output.tips.length === 0) return "貼士未能對應參考資料主題";
  // Every card must carry a name that exactly matches one we sent; the parse
  // step drops mismatches. If any card was dropped, the AI paraphrased at
  // least one name (e.g. "血壓" → "血壓及脈搏") — retry, otherwise the
  // client's cardMap lookup silently hides value + grade + date.
  if (output.cards.length < expectedCardCount) return "卡片解讀未對應項目名稱";
  return null;
}

export const generateRichSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RichSummaryInput.parse(input))
  .handler(async ({ data }) => {
    const { createGateway, serverCapOk } = await import("@/lib/ai-gateway.server");
    const req = getRequest();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    if (!serverCapOk(ip)) throw new Error("今日生成次數已達上限，請明天再試。");

    const gateway = createGateway();
    const relevantTips = selectRelevantTips(data.cards);
    const tipsText = relevantTips
      .map((t) => `【${t.topic}】\n${t.tips}`)
      .join("\n\n");

    // Wire-payload sanitize for self-lookup cards (M27): cards whose summary body
    // carries an in-app TANITA reference table for user self-classification. Local
    // CardInterpretation still carries `"無適用參考標準"` (SSOT preserved); only the
    // transient wire form sent to Gemini is transformed to a source-neutral phrase
    // so the AI's paraphrase doesn't echo the negative label the summary UI hides.
    // See ADR 0025 Source change history (M27) + PRD L51 Exception.
    const SELF_LOOKUP_CARD_NAMES = new Set(["體脂率", "基礎代謝率", "體內水分", "肌少症指數", "手握力", "坐地前伸"]);
    const cardsText = data.cards
      .map((c) => {
        const isSelfLookup = SELF_LOOKUP_CARD_NAMES.has(c.name);
        const grade = isSelfLookup ? "請自行對照下方對照表" : c.grade;
        const notePart = !isSelfLookup && c.note ? `\n備註：${c.note}` : "";
        return `${c.name}：${c.value}（${grade}）\n範圍：${c.range}\n建議：${c.action}${notePart}`;
      })
      .join("\n\n");

    const allowedNumbers = new Set([
      ...(REFERENCE_LEAFLET.match(/\d+(?:\.\d+)?/g) ?? []),
      ...(tipsText.match(/\d+(?:\.\d+)?/g) ?? []),
      ...data.cards.flatMap((c) => [
        ...(c.value.match(/\d+(?:\.\d+)?/g) ?? []),
        ...(c.range.match(/\d+(?:\.\d+)?/g) ?? []),
        ...(c.action.match(/\d+(?:\.\d+)?/g) ?? []),
      ]),
    ]);

    const validTopics = new Set(relevantTips.map((t) => t.topic));
    const validCardNames = new Set(data.cards.map((c) => c.name));

    const basePrompt = `你是一位健康紀錄的摘要助手，為50歲以上的繁體中文讀者撰寫易讀的健康報告。請用JSON格式回覆。

第一部分：逐項解讀
根據以下各項檢查結果，用溫和易懂的語言解釋每項數據代表甚麼意思、落在甚麼範圍、以及建議的跟進行動。每項約50至80字。每項解讀的 name 欄位必須與所示項目名稱完全一致（照抄「血壓」、「BMI」、「體脂率」、「內臟脂肪」、「手握力」、「坐地前伸」六者其一），不可加減字元、不可加描述。

${cardsText}

第二部分：健康貼士
根據以上結果的整體情況，從以下參考資料中挑選最相關的3至5個具體可行的健康建議。每個建議須：(1) 具體到可以明天就做，(2) 用一句話說完，(3) 於 topic 欄位填上對應的主題名稱（【】內的字串）。不可加入參考資料以外的建議。撰寫時請使用中性字詞，避免「男士、女士、長者、學生」等特定群體用語。

${tipsText}

請用以下JSON格式回覆（不要輸出其他文字）：
{"cards":[{"name":"項目名稱","interpretation":"解讀文字"}],"tips":[{"tip":"建議內容","topic":"主題名稱"}],"disclaimer":"提醒文字，須包含「醫生」二字"}`;

    const run = async (prompt: string, phase: string) => {
      try {
        const result = await generateText({
          model: gateway("gemini-3.6-flash"),
          messages: [{ role: "user", content: prompt }],
        });
        return result.text.trim();
      } catch (err) {
        console.error(`[generateRichSummary] ${phase} failed:`, err);
        throw new Error(`摘要生成暫時未能連線（${phase}）。請稍後再試。`);
      }
    };

    const parseOutput = (text: string): RawSummary => {
      const raw = extractJson(text);
      const parsed = RichSummaryOutput.parse(raw);
      parsed.tips = parsed.tips.filter((t) => validTopics.has(t.topic));
      parsed.cards = parsed.cards.filter((c) => validCardNames.has(c.name));
      return parsed;
    };

    let text = await run(basePrompt, "初次");
    let output: RawSummary;
    try {
      output = parseOutput(text);
    } catch {
      text = await run(
        `${basePrompt}\n\n【重要】上一次回覆的JSON格式不正確。請嚴格按照指定的JSON格式回覆，不要加入任何其他文字。`,
        "格式重試",
      );
      output = parseOutput(text);
    }

    const expectTips = relevantTips.length > 0;
    const expectedCardCount = data.cards.length;
    let failure = richGroundingFailure(output, allowedNumbers, expectTips, expectedCardCount);
    if (failure) {
      text = await run(
        `${basePrompt}\n\n【重要】上一次生成不合規（原因：${failure}）。請完全不要寫出任何參考資料沒有出現過的數字，並必須提醒不能取代醫生診斷，避免使用「男士、女士、長者、學生」等群體字眼。tips 陣列中每項的 topic 欄位必須完整複製參考資料【】內的主題名稱，不可簡化、不可翻譯、不可加減任何標點或字符。cards 陣列中每項的 name 欄位必須完整照抄輸入的項目名稱（例如「血壓」而非「血壓及脈搏」，「BMI」而非「BMI 體重」），不可加減字元或加描述。`,
        "合規重試",
      );
      try {
        output = parseOutput(text);
      } catch {
        throw new Error("摘要格式不正確，請稍後再試。");
      }
      failure = richGroundingFailure(output, allowedNumbers, expectTips, expectedCardCount);
    }
    if (failure) {
      throw new Error(`摘要未通過內容核對（${failure}），已停止顯示。請稍後再試或參考各項評級。`);
    }

    const agencies = Array.from(
      new Set(
        output.tips.flatMap((t) =>
          relevantTips.find((r) => r.topic === t.topic)?.sources.map((s) => s.agency) ?? [],
        ),
      ),
    );

    const result: RichSummaryResult = { ...output, agencies };
    return { ok: true as const, result };
  });

