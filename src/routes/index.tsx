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
            <Button variant="ghost" className="absolute top-4 right-4 z-10 rounded-full bg-background/40 px-3 py-1 text-xs text-foreground/80 backdrop-blur-sm hover:bg-background/60 hover:text-foreground sm:right-6">
              <ShieldCheck className="size-3.5" /> 私隱與資料使用
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
        <img
          src={frontPageAsset.url}
          alt="護心計劃，守護您的心腦血管健康"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <section className="relative flex min-h-screen w-full flex-col items-center">
          <Button
            type="button"
            onClick={() => void navigate({ to: "/logbook" })}
            size="lg"
            className="absolute bottom-[25%] sm:bottom-[17%] md:bottom-[18%] left-1/2 -translate-x-1/2 h-14 sm:h-14 w-[min(90%,23rem)] sm:w-[min(48%,12rem)] rounded-xl px-6 text-lg font-semibold shadow-lg"
          >
            進入
          </Button>
        </section>
      </main>
    );
}
