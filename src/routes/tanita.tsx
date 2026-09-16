import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/tanita")({
  head: () => ({
    meta: [
      { title: "體脂組成 — 健康紀錄簿" },
      { name: "description", content: "上載 Tanita 體脂磅屏幕照片，讀取體重、體脂率、肌肉量、BMI 與內臟脂肪。" },
      { property: "og:title", content: "體脂組成 — 健康紀錄簿" },
      { property: "og:description", content: "記錄 Tanita 體脂磅讀數，照片讀取或手動輸入。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.tanita} />,
});
