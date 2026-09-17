import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/sit-and-reach")({
  head: () => ({
    meta: [
      { title: "坐地前伸測試 — 健康紀錄簿" },
      { name: "description", content: "記錄坐地前伸測試距離；不收集年齡或性別，沒有適用參考標準時仍會保存數值。" },
      { property: "og:title", content: "坐地前伸測試 — 健康紀錄簿" },
      { property: "og:description", content: "記錄坐地前伸測試距離，資料只存在此裝置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.sitreach} />,
});
