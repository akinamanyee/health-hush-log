import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { purgeLegacyProfileData } from "@/lib/health/store";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "@/components/health/PrivacyNotice";
import frontPageAsset from "@/assets/front-page-2.jpg.asset.json";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "健康紀錄簿 — 本地優先健康日誌" },
      {
        name: "description",
        content: "記錄血壓、身體成份分析儀、手握力與坐地前伸測試讀數，資料只存在您的裝置上。",
      },
      { property: "og:title", content: "健康紀錄簿 — 本地優先健康日誌" },
      {
        property: "og:description",
        content: "從封面進入四項健康紀錄，支援拍照、上載、語音或手動輸入，資料只存在您的裝置上。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => purgeLegacyProfileData(), []);

  return (
      <main className="relative min-h-screen bg-background">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="absolute right-4 top-4 z-10 min-h-12 rounded-full bg-card/90 px-4 text-primary shadow-sm backdrop-blur sm:right-6 sm:top-6">
              <ShieldCheck className="size-5" /> 私隱與資料使用
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl bg-card">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary">私隱與資料使用</DialogTitle>
              <DialogDescription className="sr-only">健康資料、相片及醫療免責說明</DialogDescription>
            </DialogHeader>
            <PrivacyNotice context="cover" />
          </DialogContent>
        </Dialog>
        <section className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void navigate({ to: "/logbook" })}
            className="relative h-[calc(100svh-2.5rem)] max-h-[1920px] w-auto max-w-full overflow-hidden rounded-[2rem] border border-border bg-card p-0 shadow-2xl hover:bg-card focus-visible:ring-4"
          >
            <img
              src={frontPageAsset.url}
              alt="護心計劃，守護您的心腦血管健康"
              className="h-full w-auto max-w-full object-contain"
            />
            <span className="sr-only">護心計劃，守護您的心腦血管健康，開始檢測，進入</span>
          </Button>
        </section>
      </main>
    );
}
