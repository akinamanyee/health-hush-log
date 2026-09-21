import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { purgeLegacyProfileData } from "@/lib/health/store";
import { Button } from "@/components/ui/button";
import { PrivacyNotice } from "@/components/health/PrivacyNotice";
const frontPageUrl = "/images/front-page-4.jpg";
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
      <main className="relative min-h-screen overflow-hidden">
        <img
          src={frontPageUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover blur-3xl brightness-105"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#e6f9f0]/70" />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="absolute right-2 bottom-[max(0.25rem,env(safe-area-inset-bottom))] z-10 min-h-11 px-3 text-sm font-normal text-foreground/60 hover:bg-transparent hover:text-foreground hover:underline sm:right-4"
            >
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
        <button
          type="button"
          onClick={() => void navigate({ to: "/logbook" })}
          aria-label="進入健康紀錄簿"
          className="absolute inset-0 flex h-full w-full appearance-none items-center justify-center border-0 bg-transparent p-0 text-left cursor-pointer transition-opacity duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <img
            src={frontPageUrl}
            alt="護心計劃，守護您的心腦血管健康，輕鬆記錄評估資料"
            className="pointer-events-none h-full w-full object-cover object-[center_30%] -translate-y-14 motion-reduce:transform-none sm:-translate-y-8 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent),linear-gradient(to_bottom,transparent,black_6%,black_55%,transparent_72%)] [mask-composite:intersect] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent),linear-gradient(to_bottom,transparent,black_6%,black_55%,transparent_72%)] [-webkit-mask-composite:source-in]"
          />
        </button>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[45%] sm:h-[38%] bg-[linear-gradient(to_top,#e6f9f0,#e6f9f0_70%,transparent_88%)]" />
        <Button
          type="button"
          onClick={() => void navigate({ to: "/logbook" })}
          size="lg"
          className="absolute bottom-24 left-1/2 z-10 min-h-14 w-[min(80%,20rem)] -translate-x-1/2 rounded-xl px-8 text-lg font-semibold shadow-lg"
        >
          進入
        </Button>
      </main>
    );
}
