import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/tanita")({
  head: () => ({
    meta: [
      { title: "身體成份分析儀 — 健康紀錄簿" },
      { name: "description", content: "拍攝或上載身體成份分析儀屏幕照片，讀取體重、體脂率、肌肉量、BMI 與內臟脂肪。" },
      { property: "og:title", content: "身體成份分析儀 — 健康紀錄簿" },
      { property: "og:description", content: "記錄身體成份分析儀讀數，照片讀取或手動輸入。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.tanita} />,
});
