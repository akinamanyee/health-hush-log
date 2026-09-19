import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/health/Dashboard";

export const Route = createFileRoute("/logbook")({
  head: () => ({
    meta: [
      { title: "健康紀錄簿 — 四項健康紀錄" },
      { name: "description", content: "記錄血壓、身體成份分析儀、手握力與坐地前伸測試，資料只存在此裝置。" },
      { property: "og:title", content: "健康紀錄簿 — 四項健康紀錄" },
      { property: "og:description", content: "四項健康紀錄及本機歷史，資料只存在此裝置。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});