import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/grip")({
  head: () => ({
    meta: [
      { title: "手握力紀錄 — 健康紀錄簿" },
      { name: "description", content: "記錄手握力讀數；不收集年齡或性別，沒有適用參考標準時仍會保存數值。" },
      { property: "og:title", content: "手握力紀錄 — 健康紀錄簿" },
      { property: "og:description", content: "記錄手握力讀數，資料只存在此裝置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.grip} />,
});
