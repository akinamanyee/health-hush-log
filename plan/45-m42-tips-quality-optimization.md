# M42 — 貼士質素優化：具體 · 分級語氣 · 去除口頭禪

**Status:** approved 2026-09-30

## Goal

第二部分「健康貼士」目前存在四類問題：
1. 「明天就做」重複到用家煩厭。
2. 「少油少糖」「中等強度運動」「保持腰圍健康」等模糊字眼未有量化。
3. 出現「參考對照表」提示（用家已看過）。
4. 對全部達標的人也給大量建議，令鼓勵變成壓力；對多項不達標的人又欠缺健康風險提示。

## What we build

Three coordinated edits:

**A. `src/lib/health/charts.ts` — 四條新 TIPS_REFERENCE 主題**
- 【中等強度運動定義】：快步行、社交舞、太極、上落樓梯；每星期 ≥150 分鐘中等強度 + ≥2 次肌肉強化（衞生署 + 衞生防護中心）。
- 【蔬果攝取量】：每日 2 份水果 + 3 份蔬菜；份量定義；一日餐單實例（衞生署）。
- 【減鹽減糖減油定義】：鹽 <5g/日、糖 <25g/日、油 5-6 茶匙/日；具體做法（衞生署）。
- 【腰圍與中央肥胖】：男 <90cm、女 <80cm；量度方法；風險係數（衞生署 + 衞生防護中心）。

**B. `src/lib/health/ai.functions.ts::selectRelevantTips` — 擴展 card→topics 映射**
- 血壓非正常 → 追加 減鹽減糖減油定義 / 腰圍與中央肥胖 / 中等強度運動定義。
- BMI 非正常 → 追加 蔬果攝取量 / 減鹽減糖減油定義 / 中等強度運動定義 / 腰圍與中央肥胖。
- 內臟脂肪非正常 → 追加 腰圍與中央肥胖 / 蔬果攝取量 / 中等強度運動定義。
- 手握力/坐地前伸 → 追加 中等強度運動定義。
- 全 normal 兜底 → 追加 蔬果攝取量 / 中等強度運動定義。

**C. `src/lib/health/ai.functions.ts` — `bucketByGrade` helper + Part 2 posture-conditional 段落**

Bucket 依 血壓 / BMI / 內臟脂肪 三張可評級卡片：
- `normal`：全部正常 → 1–2 條輕鬆鼓勵語，肯定狀態，提邊際優化。**不列風險。**
- `few-off`：1–2 項未達標 → 3–4 條具體建議；語氣中性務實；針對未達標項目 + 生活習慣。
- `many-or-crisis`：≥3 項未達標 或 任一屬 嚴重偏高 / 高血壓（第二期）/ 過高 → 4–5 條具體建議；開首明列健康風險（中風/心血管/糖尿病）；語氣堅定；仍附醫生提醒。

自查卡片（體脂率/基礎代謝率/體內水分/肌少症指數/手握力/坐地前伸）為 opaque，不參與 bucket 計算（PRD L51 Exception、ADR 0025）。

Bucket 描述用中文數字（一、兩、三、四、五）避免與 `allowedNumbers` 檢查衝突。

Prompt 明列「嚴禁事項」：
- 禁用「明天就做/明天可以」。
- 禁叫用家「參考/查看/見下方對照表」——用家已看過；若原文提及對照表，只保留具體建議。
- 禁模糊字詞單獨出現（「少油少糖」「適量運動」「中等強度運動」必須附定義）。
- 禁加入參考資料以外的建議或數字。
- 男性/女性可用於腰圍量度標準（非群體標籤）；「男士/女士/長者/學生」仍禁。

## PRD alignment

| PRD | Check |
|---|---|
| L13/L47 anonymous | ✓ prompt content only；未新增性別/年齡收集 |
| L23 NORTHSTAR (trustworthy) | ✓ 更具體、更 actionable、無煩厭口頭禪 |
| L48 local-only | ✓ 無 storage 改動 |
| L50 wire | ✓ 卡片 shape 無變 |
| L51 grading + Exception | ✓ bucket 只看三張可評級卡片；自查卡片仍 opaque；SELF_LOOKUP_CARD_NAMES sanitize 無變 |
| L52 grounded AI | ✓ 4 條新 TIPS_REFERENCE 全部有 named agency source；bucket 由後端 code 決定；richGroundingFailure 全部 gate 保留 |
| L55 繁中 | ✓ 全部繁中；語氣分級針對 50+ 讀者 |
| L57 minimal | ✓ 只改 prompt + 資料表；無 UI 改動 |

## Design decisions

1. **Bucket 只看三張卡片**：血壓/BMI/內臟脂肪 是全 app 唯一有明確 grade 的評級卡（其他六張走自查對照表）。若把自查卡納入 bucket，會令 grading 隱含地建立性別/年齡標準，違反 L13。
2. **Chinese numerals in bucket text**：`allowedNumbers` set 用 `\d+` 正則抽取；用「一至兩條」「三至四條」避免這些純結構詞被誤判為 invented number。
3. **「男性腰圍」「女性腰圍」允許**：`SENSITIVE_LABEL_PATTERN` 是 `/男士|女士|長者|學生/`，男性/女性不觸發；且腰圍標準本身就分性別。
4. **四條新主題有數字**：`5g/25g/90cm/80cm/150 分鐘` 等會透過 `tipsText.match(/\d+/g)` 進入 `allowedNumbers`，AI 可安全引用。
5. **舊主題不刪**：BMI/心腦血管等舊 TIPS_REFERENCE 保留，AI 可從擴大的池挑選；只是加入更多具體選擇。
6. **不 hardcode「對照表」黑名單**：只在 prompt 層明列禁令；如 AI 偶爾違反，作為軟性下限接受（現時無 gate 檢測，避免過度硬化 retry 邏輯）。

## Risks + fixes

| Risk | Fix |
|---|---|
| 新主題引入 WHO agency 但 Agency type 未包含 | 只用 衞生署 / 衞生防護中心 兩個既有 agency（WHO 內容由衞生署轉載）。 |
| bucket 邏輯誤判 | 只看三張卡；`嚴重偏高`（血壓）、`高血壓（第二期）`、`過高`（BMI/內臟脂肪）明列為 crisis；`正常偏高`起計 off。 |
| 中文數字被 AI 讀成阿拉伯數字寫回 | Prompt 只用中文數字；若 AI 寫「3 條」而參考資料無「3」，會被 richGroundingFailure 抓住—— retry 覆蓋。 |
| Retry cascade 破 bucket 語氣 | 兩個 retry 都 append 到 basePrompt；bucketBlock 已在 basePrompt 內。 |
| 對照表提示如仍出現 | 屬軟性下限；無 hard gate；下一個 milestone 若仍有問題再加正則 filter。 |

## Files to touch

1. `src/lib/health/charts.ts` — TIPS_REFERENCE 追加 4 條。
2. `src/lib/health/ai.functions.ts` — `selectRelevantTips` 擴展、`bucketByGrade` 新增、Part 2 prompt 重寫。
3. `plan/45-m42-tips-quality-optimization.md`（本檔）
4. `Product_Roadmap.md`
5. `CHANGELOG.md`

## Non-goals

無 storage / wire / JSON-shape / grounding-check 結構改動；無新 ADR；無 PRD 改動；無 UI 改動；SELF_LOOKUP_CARD_NAMES 及 CARDS_WITH_SELF_LOOKUP 名單不變。

## Acceptance

1. `bunx tsc --noEmit` clean；`bun run build` clean。
2. 部署後：
   - 全部正常之樣本 → Part 2 只顯示 1–2 條鼓勵語；無風險字眼。
   - 血壓「正常偏高」+ BMI「偏高」樣本 → Part 2 顯示 3–4 條具體建議；語氣中性。
   - 血壓「高血壓（第二期）」+ BMI「過高」+ 內臟脂肪「過高」樣本 → Part 2 開首列健康風險；顯示 4–5 條建議。
3. 建議內出現具體數字（例如 150 分鐘 / 90 cm / 5 克），不再出現「少油少糖」「適量運動」單獨字眼。
4. 不再出現「明天就做」「明天可以」「參考對照表」等字眼。
5. 卡片 name 全部照抄；richGroundingFailure 不觸發。
