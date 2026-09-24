// Deterministic grading tables. AI never grades — these charts do.
//
// Provenance (single named source per table, no blending, no extrapolation):
// - Blood pressure: 2017 ACC/AHA Hypertension Guideline categories
//   (normal / elevated / stage 1 / stage 2), plus the guideline's
//   hypertensive-crisis threshold of 180/110 mmHg.
// - BMI: WHO Asia-Pacific (2000) cut-offs for Asian adults.
// - Visceral fat: Tanita body-composition analyser manual rating scale
//   (1–9 healthy, 10–14 high, 15+ very high).
// Hand grip and sit-and-reach have no chart that applies without age and
// gender, which this app does not collect — those modules record the reading
// and report 「無適用參考標準」 rather than grading against a guessed band.

export interface BpTier {
  id: string;
  label: string;
  description: string;
  recheckMonths: number | "urgent";
}

export const BP_TIERS: BpTier[] = [
  { id: "normal", label: "正常", description: "血壓處於理想範圍", recheckMonths: 24 },
  { id: "elevated", label: "正常偏高", description: "建議留意生活習慣", recheckMonths: 12 },
  { id: "stage1", label: "高血壓（第一期）", description: "建議諮詢醫生", recheckMonths: 6 },
  { id: "stage2", label: "高血壓（第二期）", description: "建議盡快諮詢醫生", recheckMonths: 6 },
  { id: "crisis", label: "嚴重偏高", description: "請即時就醫", recheckMonths: "urgent" },
];

// Evaluate systolic and diastolic independently, take the worse of the two —
// this is what makes isolated systolic hypertension (e.g. 152/78) grade
// correctly instead of being averaged away.
export function gradeBloodPressure(systolic: number, diastolic: number): BpTier {
  const sysIdx =
    systolic >= 180 ? 4 : systolic >= 160 ? 3 : systolic >= 140 ? 2 : systolic >= 120 ? 1 : 0;
  const diaIdx =
    diastolic >= 110 ? 4 : diastolic >= 100 ? 3 : diastolic >= 90 ? 2 : diastolic >= 80 ? 1 : 0;
  return BP_TIERS[Math.max(sysIdx, diaIdx)]!;
}

export function isIsolatedSystolic(systolic: number, diastolic: number): boolean {
  return systolic >= 140 && diastolic < 90;
}

// Body-composition bands. Deterministic, same status as the tables above.
export type BandGrade = "過輕" | "偏低" | "正常" | "偏高" | "過高" | "無適用參考標準";

// Asian BMI cut-offs.
export function gradeBmi(bmi: number): BandGrade {
  if (bmi < 18.5) return "過輕";
  if (bmi < 23) return "正常";
  if (bmi < 25) return "偏高";
  return "過高";
}

export function gradeVisceralFat(level: number): BandGrade {
  if (level <= 9) return "正常";
  if (level <= 14) return "偏高";
  return "過高";
}

// Bundled reference-leaflet text: the ONLY material the AI summary may use.
export const REFERENCE_LEAFLET = `
【血壓參考】正常：收縮壓低於120且舒張壓低於80。正常偏高：收縮壓120–139或舒張壓80–89。高血壓第一期：收縮壓140–159或舒張壓90–99。高血壓第二期：收縮壓160–179或舒張壓100–109。嚴重偏高：收縮壓180或以上，或舒張壓110或以上，應即時就醫。單純收縮期高血壓指收縮壓140或以上而舒張壓低於90，常見於年長人士。建議：少鹽飲食、規律運動、維持健康體重、按時量度。
【身體成份分析儀參考】體脂率過高與心血管疾病風險相關。BMI（亞洲標準）：低於18.5屬過輕，18.5至22.9屬正常，23至24.9屬偏高，25或以上屬過高。體脂率：正常範圍因性別及年齡而異，本應用程式在體脂率卡片下方展示標準脂肪量對照表供用家自行對照，但因不收集性別及年齡而不進行分級。體脂率過高與心血管疾病及代謝綜合症風險相關。內臟脂肪等級9或以下屬健康範圍，10至14屬偏高，15或以上屬過高。維持肌肉量有助長者保持活動能力。
【身體水分參考】成年人身體水分一般佔體重的45%至65%，充足的水分有助維持代謝功能及器官運作。水分率偏低可能與脫水或肌肉量不足有關。
【基礎代謝率參考】基礎代謝率是指身體在完全靜止狀態下維持生命所需的最低熱量消耗。肌肉量較高者一般基礎代謝率亦較高。基礎代謝率可用千卡（kcal）或千焦（kJ）表示，1千卡約等於4.184千焦。
【手握力參考】手握力是長者肌力與整體健康的重要指標，手握力偏弱與活動能力下降相關。可透過握力球、阻力帶等簡單訓練改善。
【坐地前伸測試參考】坐地前伸測試反映膕繩肌與下背柔軟度。規律伸展可改善柔軟度，減少跌倒與腰背痛風險。
【一般建議】本應用程式所有內容僅供參考，不能取代醫生診斷。如讀數嚴重偏高或身體不適，請即時就醫。
`.trim();

// Agency labels shown to users. Titles and URLs stay internal for grounding
// traceability; only the agency appears in the UI, so that source names like
// 男士健康、學生健康 (which some Hong Kong government articles carry) never
// leak into the summary, and the credibility signal reads as government-issued.
export type Agency = "衞生防護中心" | "衞生署" | "職業安全健康局" | "醫管局";

export interface TipBlock {
  topic: string;
  tips: string;
  sources: { title: string; url: string; agency: Agency }[];
}

export function agenciesForTopic(topic: string): Agency[] {
  const block = TIPS_REFERENCE.find((t) => t.topic === topic);
  if (!block) return [];
  return Array.from(new Set(block.sources.map((s) => s.agency)));
}

export const TIPS_REFERENCE: TipBlock[] = [
  {
    topic: "心腦血管病、中風及預防",
    tips: `預防中風及心血管疾病的方法：(1) 定期量度血壓，高血壓患者須遵從醫囑服藥。(2) 戒煙，吸煙令中風風險增加27%。(3) 避免過量飲酒。(4) 控制體重及腰圍（男性腰圍<90厘米、女性<80厘米）。(5) 每週做至少150分鐘中等強度或75分鐘劇烈運動。(6) 健康飲食：每天最少5份蔬果、少油少鹽少糖。(7) 適當處理工作壓力。中風警號（FAST）：面部歪斜、手臂無力、說話困難、立即求醫。`,
    sources: [
      { title: "中風", url: "https://www.chp.gov.hk/tc/healthtopics/content/25/55.html", agency: "衞生防護中心" },
      { title: "腦血管病", url: "https://www.chp.gov.hk/tc/healthtopics/content/25/57.html", agency: "衞生防護中心" },
      { title: "預防心血管疾病知多啲", url: "https://www.oshc.org.hk/oshc-publications/occupational-health-publications/", agency: "職業安全健康局" },
    ],
  },
  {
    topic: "BMI（體重管理）",
    tips: `體重管理要點：(1) BMI（亞洲標準）18.5至22.9屬正常，23或以上屬過重，需注意。(2) 蘋果形身型（腰腹脂肪多）比啤梨形風險更高。(3) 定時飲食，不省早餐，戒掉宵夜。(4) 慢慢進食，每次咬一小口，感覺七至八成飽即停。(5) 以水果代替薯片、朱古力等零食。(6) 選擇低脂食品，多飲清水。(7) 以行樓梯代替電梯，午飯時步行10分鐘。(8) 超重會增加高血壓、糖尿病、心臟病風險。`,
    sources: [
      { title: "體重管理行動計劃", url: "https://www.change4health.gov.hk/tc/healthy_weight/bmi/", agency: "衞生署" },
      { title: "肥胖問題", url: "https://www.studenthealth.gov.hk/tc_chi/health/health_ophp/health_ophp.html", agency: "衞生署" },
      { title: "控制體重的方法", url: "https://www.change4health.gov.hk/tc/healthy_weight/control_weight/", agency: "衞生署" },
    ],
  },
  {
    topic: "高血壓及預防",
    tips: `預防及控制高血壓：(1) 香港約29.5%人口有高血壓，近半不自知，應定期量度。(2) 減少鹽分攝取：少用醬油、蠔油、魚露等。(3) 控制體重：BMI每增加5，高血壓風險升49%；腰圍每增10厘米風險升27%。(4) 避免久坐：每天久坐多1小時，高血壓風險增4%。(5) 戒煙：吸煙令風險增27%。(6) 腰圍是內臟脂肪的指標——男性腰圍90厘米或以上、女性80厘米或以上屬中央肥胖。(7) 每週做150分鐘中等強度運動，減少長時間靜坐。`,
    sources: [
      { title: "高血壓", url: "https://www.chp.gov.hk/tc/healthtopics/content/25/35390.html", agency: "衞生防護中心" },
      { title: "腰圍、體型及健康", url: "https://www.change4health.gov.hk/tc/healthy_weight/waist/", agency: "衞生署" },
      { title: "保持健康腰圍", url: "https://www.change4health.gov.hk/tc/healthy_weight/keep_healthy_waist/", agency: "衞生署" },
    ],
  },
  {
    topic: "內臟脂肪問題與預防",
    tips: `內臟脂肪管理：(1) 內臟脂肪等級9或以下屬正常，10至14屬偏高，15或以上屬過高。(2) 蘋果形身型（脂肪集中腰腹）患心臟病及糖尿病風險較高。(3) 腰圍每增10厘米，全因死亡風險增11%。(4) 飲食以健康飲食金字塔為原則：穀物最多、蔬菜其次、肉類最少。(5) 每天最少吃3份蔬菜及2份水果。(6) 每週做150分鐘中等強度運動。(7) 減少長時間坐著，每30至60分鐘起身活動。`,
    sources: [
      { title: "腰圍、體型及健康", url: "https://www.change4health.gov.hk/tc/healthy_weight/waist/", agency: "衞生署" },
      { title: "保持健康腰圍", url: "https://www.change4health.gov.hk/tc/healthy_weight/keep_healthy_waist/", agency: "衞生署" },
    ],
  },
  {
    topic: "健康飲食（針對過重及高血壓）",
    tips: `健康飲食實用建議：(1) 飯盒比例3:2:1（穀物:蔬菜:肉類）。(2) 每日「二加三」——2份水果加3份蔬菜（1份水果＝1個中型水果；1份蔬菜＝半碗煮熟蔬菜）。(3) 買菜選新鮮食材、瘦肉、低脂奶品。(4) 烹調去皮去脂，用蒸、燉、炆、烚代替煎炸，以天然調味（薑蔥蒜）代替醬料。(5) 外出用餐：選清湯麵飯、要求「醬汁另上」、多叫灼菜、飲清水或清茶。(6) 減少飽和脂肪及反式脂肪：少吃牛角包、酥皮，吃肉去皮去肥膏。(7) 每週吃兩次魚，選用橄欖油等植物油。(8) 吃全穀類食物如麥皮、紅糙米。(9) 慢慢進食，七至八成飽即停。`,
    sources: [
      { title: "預防肥胖與飲食建議", url: "https://www.change4health.gov.hk/tc/healthy_diet/preventive_diet/", agency: "衞生署" },
      { title: "均衡飲食FAQ", url: "https://www.change4health.gov.hk/tc/healthy_diet/faq/", agency: "衞生署" },
      { title: "當外出用膳時", url: "https://www.change4health.gov.hk/tc/healthy_diet/facts/eat_smart/eating_out/index.html", agency: "衞生署" },
      { title: "高血壓", url: "https://www.chp.gov.hk/tc/healthtopics/content/25/35390.html", agency: "衞生防護中心" },
    ],
  },
  {
    topic: "日常運動（針對預防過重）",
    tips: `運動建議：(1) 每天累積至少30分鐘中等強度運動（如急步行、踏單車、游泳），可分段進行，每段最少10分鐘。(2) 日常增加活動量：行樓梯代替電梯、午飯步行10分鐘、看電視時站起伸展。(3) 運動三類型均衡：耐力運動（步行、游泳）、伸展運動（太極、瑜珈）、重力運動（行樓梯、掌上壓）。(4) 跑步前2小時進食，以碳水化合物為主，避免空腹或飽腹運動。(5) 運動前先熱身3至5分鐘，伸展時維持10至30秒。(6) 運動後慢跑或步行3至5分鐘作緩和。(7) 隨時補充水分，避免含酒精或咖啡因飲料。(8) 感到不適應立即停止，如有健康問題先諮詢醫生。`,
    sources: [
      { title: "有關跑步的健康建議", url: "https://www.chp.gov.hk/tc/static/101307.html", agency: "衞生防護中心" },
      { title: "體重管理行動計劃", url: "https://www.change4health.gov.hk/tc/healthy_weight/bmi/", agency: "衞生署" },
      { title: "控制體重的方法", url: "https://www.change4health.gov.hk/tc/healthy_weight/control_weight/", agency: "衞生署" },
    ],
  },
  {
    topic: "體脂率參考標準",
    tips: `體脂率健康範圍要點：(1) 體脂率的健康範圍會因性別及年齡而異，並非單一數值；醫管局及世衞太平洋建議提供性別和年齡分組的參考範圍，宜對照卡片下方之對照表。(2) 體脂率過高與心血管疾病及代謝綜合症風險相關。(3) 中央肥胖（腰腹脂肪多）比整體超重對心血管及糖尿病風險更高，宜同時留意腰圍。(4) 每天最少30分鐘中等強度運動、少油少糖飲食有助控制體脂。`,
    sources: [
      { title: "我的體重是否在健康範圍內呢？", url: "https://www3.ha.org.hk/dic/gn_06_04.html", agency: "醫管局" },
    ],
  },
];
