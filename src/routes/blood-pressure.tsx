import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/blood-pressure")({
  head: () => ({
    meta: [
      { title: "血壓紀錄 — 健康紀錄簿" },
      { name: "description", content: "記錄收縮壓、舒張壓與脈搏，按參考標準評級並計算複查日期。" },
      { property: "og:title", content: "血壓紀錄 — 健康紀錄簿" },
      { property: "og:description", content: "記錄血壓，按參考標準評級並計算複查日期。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.bp} />,
});
