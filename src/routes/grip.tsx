import { createFileRoute } from "@tanstack/react-router";
import { RecordModule } from "@/components/health/RecordModule";
import { MODULE_BY_ID } from "@/lib/health/modules";

export const Route = createFileRoute("/grip")({
  head: () => ({
    meta: [
      { title: "握力紀錄 — 健康紀錄簿" },
      { name: "description", content: "記錄握力，按年齡及性別參考標準評級。" },
      { property: "og:title", content: "握力紀錄 — 健康紀錄簿" },
      { property: "og:description", content: "記錄握力，按年齡及性別參考標準評級。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RecordModule mod={MODULE_BY_ID.grip} />,
});
