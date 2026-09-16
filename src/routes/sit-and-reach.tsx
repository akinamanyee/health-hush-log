import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/sit-and-reach")({
  head: () => ({
    meta: [
      { title: "坐位體前彎 — 健康紀錄簿" },
      { name: "description", content: "記錄坐位體前彎距離，按年齡及性別參考標準評級。" },
      { property: "og:title", content: "坐位體前彎 — 健康紀錄簿" },
      { property: "og:description", content: "記錄柔軟度，按年齡及性別參考標準評級。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.sitreach} />,
});
