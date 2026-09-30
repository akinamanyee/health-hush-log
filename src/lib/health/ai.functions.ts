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
  muscleArmL: z.number().nullable(),
  muscleArmR: z.number().nullable(),
  muscleLegL: z.number().nullable(),
  muscleLegR: z.number().nullable(),
  bodyWaterPct: z.number().nullable(),
  bodyWaterKg: z.number().nullable(),
  visceralFat: z.number().nullable(),
  bmrKcal: z.number().nullable(),
  bmrKj: z.number().nullable(),
});

const BP_SCHEMA = z.object({
  systolic: z.number().nullable(),
  diastolic: z.number().nullable(),
  pulse: z.number().nullable(),
});

const GRIP_SCHEMA = z.object({ grip: z.number().nullable() });
const SIT_REACH_SCHEMA = z.object({ distance: z.number().nullable() });

const EXTRACTION_FIELDS = {
  tanita: "weight（體重 kg）、bodyFat（體脂率 %）、fatMass（體脂量 kg）、muscleMass（肌肉量 kg）、muscleRatio（肌肉比率 %）、muscleArmL（左臂肌肉量 kg）、muscleArmR（右臂肌肉量 kg）、muscleLegL（左腿肌肉量 kg）、muscleLegR（右腿肌肉量 kg）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）、visceralFat（內臟脂肪等級）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）",
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
  muscle: "weight（體重 kg）、muscleMass（肌肉量 kg）、muscleRatio（肌肉比率 %）",
  asm: "weight（體重 kg）、muscleArmL（左臂肌肉量 kg，即 L ARM）、muscleArmR（右臂肌肉量 kg，即 R ARM）、muscleLegL（左腿肌肉量 kg，即 L LEG）、muscleLegR（右腿肌肉量 kg，即 R LEG）",
  water: "weight（體重 kg）、bodyWaterPct（身體水分率 %）、bodyWaterKg（身體水分量 kg）",
  visceral: "weight（體重 kg）、visceralFat（內臟脂肪等級）",
  bmr: "weight（體重 kg）、bmrKcal（基礎代謝率 kcal）、bmrKj（基礎代謝率 kJ）",
  // bmi screen removed (M39): height is typed, BMI is derived; no camera path.
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

    const extractT0 = Date.now();
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
      console.log(`[extractFromImage] ai ok ${Date.now() - extractT0}ms module=${data.module} screen=${data.screen ?? "all"}`);
    } catch (err) {
      console.error(`[extractFromImage] ai failed ${Date.now() - extractT0}ms:`, err);
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
      topics.add("減鹽減糖減油定義");
      topics.add("腰圍與中央肥胖");
      topics.add("中等強度運動定義");
    }
    if (n === "BMI" && (g === "偏高" || g === "過高" || g === "過輕")) {
      topics.add("BMI（體重管理）");
      topics.add("健康飲食（針對過重及高血壓）");
      topics.add("日常運動（針對預防過重）");
      topics.add("蔬果攝取量");
      topics.add("減鹽減糖減油定義");
      topics.add("中等強度運動定義");
      topics.add("腰圍與中央肥胖");
    }
    if (n === "內臟脂肪" && g !== "正常") {
      topics.add("內臟脂肪問題與預防");
      topics.add("心腦血管病、中風及預防");
      topics.add("腰圍與中央肥胖");
      topics.add("蔬果攝取量");
      topics.add("中等強度運動定義");
    }
    if (n === "體脂率") {
      topics.add("體脂率參考標準");
    }
    if (n === "手握力" || n === "坐地前伸") {
      topics.add("日常運動（針對預防過重）");
      topics.add("中等強度運動定義");
    }
  }
  if (topics.size === 0) {
    topics.add("健康飲食（針對過重及高血壓）");
    topics.add("日常運動（針對預防過重）");
    topics.add("蔬果攝取量");
    topics.add("中等強度運動定義");
  }
  return TIPS_REFERENCE.filter((t) => topics.has(t.topic));
}

// M42: posture bucket for Part 2 tips. Only 血壓/BMI/內臟脂肪 count — the
// self-lookup cards (體脂率/基礎代謝率/體內水分/肌少症指數/手握力/坐地前伸)
// are opaque to the AI by design (PRD L51 Exception, ADR 0025). Crisis grade
// on any counted card jumps straight to many-or-crisis.
type GradeBucket = "no-graded" | "normal" | "few-off" | "many-or-crisis";
function bucketByGrade(cards: z.infer<typeof RichSummaryInput>["cards"]): GradeBucket {
  const graded = cards.filter((c) => c.name === "血壓" || c.name === "BMI" || c.name === "內臟脂肪");
  // M42a: honest framing when none of the three grading anchors were measured
  // (grip-only, sit-reach-only, or self-lookup-only Tanita sessions). Must
  // precede the off-count check because graded.length === 0 also has
  // off.length === 0 and would otherwise fall into "normal" and let the AI
  // claim 「三項可評級指標全部落在正常範圍」 — a fabrication that violates
  // PRD L23 (trustworthy) and L52 (grounded).
  if (graded.length === 0) return "no-graded";
  const offGrades = new Set(["正常偏高", "高血壓（第一期）", "高血壓（第二期）", "嚴重偏高", "偏高", "過高", "過輕"]);
  const crisisGrades = new Set(["嚴重偏高", "高血壓（第二期）", "過高"]);
  const off = graded.filter((c) => offGrades.has(c.grade));
  const crisis = graded.some((c) => crisisGrades.has(c.grade));
  if (off.length === 0) return "normal";
  if (crisis || off.length >= 3) return "many-or-crisis";
  return "few-off";
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
    const handlerT0 = Date.now();
    try {
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

    // M41: dynamic card-name whitelist derived from the actual data.cards.
    // Fixes a stale hardcoded 「六者其一」 list that omitted 基礎代謝率 /
    // 體內水分 / 肌少症指數 (added since M27), causing the AI to drop those
    // cards and trip the parseOutput length check when a full Tanita record
    // was summarised. Same Set the parseOutput filter uses at line ~301, so
    // prompt authority and filter authority stay in sync forever.
    const cardNameList = Array.from(validCardNames).map((n) => `「${n}」`).join("、");

    // M42: posture-conditional Part 2 guidance. Buckets are derived from
    // 血壓/BMI/內臟脂肪 only; self-lookup cards stay opaque per PRD L51.
    // Chinese numerals used for the count words so they don't collide with
    // allowedNumbers grounding.
    const bucket = bucketByGrade(data.cards);
    const bucketBlock =
      bucket === "no-graded"
        ? `整體情況：今次紀錄未包含血壓、BMI 或內臟脂肪等可評級指標，只有自查對照的項目。第二部分請就用家實際錄入的項目給一至兩條中性的日常提醒（例如維持運動、均衡飲食、充足水分），語氣輕鬆。切勿對用家未量度的指標（例如血壓、BMI、內臟脂肪）作出任何判斷，切勿使用「全部正常」「全部達標」「有健康風險」等結論式字眼。`
        : bucket === "normal"
        ? `整體情況：三項可評級指標（血壓、BMI、內臟脂肪）全部落在正常範圍。第二部分請只給一至兩條輕鬆的鼓勵語句，肯定用家目前的狀態，並提出邊際上可以再做好一點的方向（例如豐富運動類型、加多一份蔬果）。切勿製造焦慮，切勿列出風險。`
        : bucket === "few-off"
        ? `整體情況：三項可評級指標之中，有一至兩項未達正常。第二部分請給三至四條具體可行的建議，語氣中性務實，先針對未達標的項目，再帶出配合的生活習慣。可以順帶提一句正面肯定達標的項目。`
        : `整體情況：三項可評級指標之中，有三項未達標，或其中一項屬嚴重偏高／過高。第二部分請給四至五條具體可行的建議，語氣要堅定，開首一句清楚說明持續處於此情況會帶來的健康風險（例如中風、心血管疾病、糖尿病），然後鼓勵用家認真跟進，並列出可立即實行的做法。仍須提醒不能取代醫生診斷。`;

    const basePrompt = `你是一位健康紀錄的摘要助手，為50歲以上的繁體中文讀者撰寫易讀的健康報告。請用JSON格式回覆。

第一部分：逐項解讀
根據以下各項檢查結果，用溫和易懂的語言解釋每項數據代表甚麼意思、落在甚麼範圍、以及建議的跟進行動。每項約50至80字。每項解讀的 name 欄位必須與所示項目名稱完全一致（照抄以下之一：${cardNameList}），不可加減字元、不可加描述。

${cardsText}

第二部分：健康貼士

${bucketBlock}

從以下參考資料中挑選最相關的建議，數量按上述整體情況指引。每個建議必須：(1) 具體、可執行、有數字或明確做法（例如「每日食兩份水果加三份蔬菜」而非「多食蔬果」；「快步行三十分鐘」而非「保持運動」；「男性腰圍保持少於九十厘米」而非「注意腰圍」）。(2) 用一至兩句寫完。(3) 於 topic 欄位填上對應的主題名稱（【】內的字串，完整照抄）。

嚴禁事項：
- 嚴禁用「明天就做」「明天可以」等字眼——每次都出現會令用家煩厭；請用「今日起」「日常」「每星期」或直接列出頻率。
- 嚴禁叫用家「參考對照表」「查看對照表」「見下方對照表」——用家已看過。若原文提及對照表，請只保留當中的具體建議，改寫時繞開對照表字眼。
- 嚴禁模糊字詞：「少油少糖」「適量運動」「注意飲食」「中等強度運動」單獨出現，必須附上參考資料內的定義（例如「鹽每日少於五克」「快步行、太極、社交舞等中等強度活動每星期最少一百五十分鐘」）。
- 嚴禁加入參考資料以外的建議或數字。
- 撰寫時使用中性字詞，避免「男士、女士、長者、學生」等群體用語（但描述腰圍標準時可寫「男性腰圍」「女性腰圍」，因為這是量度標準而非群體標籤）。

${tipsText}

請用以下JSON格式回覆（不要輸出其他文字）：
{"cards":[{"name":"項目名稱","interpretation":"解讀文字"}],"tips":[{"tip":"建議內容","topic":"主題名稱"}],"disclaimer":"提醒文字，須包含「醫生」二字"}`;

    const run = async (prompt: string, phase: string) => {
      const t0 = Date.now();
      try {
        const result = await generateText({
          model: gateway("gemini-3.6-flash"),
          messages: [{ role: "user", content: prompt }],
        });
        console.log(`[generateRichSummary] ${phase} ok ${Date.now() - t0}ms`);
        return result.text.trim();
      } catch (err) {
        console.error(`[generateRichSummary] ${phase} failed ${Date.now() - t0}ms:`, err);
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
    console.log(`[generateRichSummary] total ${Date.now() - handlerT0}ms cards=${data.cards.length}`);
    return { ok: true as const, result };
    } catch (err) {
      console.log(`[generateRichSummary] total ${Date.now() - handlerT0}ms cards=${data.cards.length} (errored)`);
      throw err;
    }
  });

