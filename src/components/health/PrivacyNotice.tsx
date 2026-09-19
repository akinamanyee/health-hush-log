import { Camera, FileText, ShieldCheck } from "lucide-react";

type NoticeContext = "cover" | "module" | "summary" | "dashboard";

const COPY: Record<NoticeContext, string[]> = {
  cover: [
    "健康紀錄只保存在此裝置的瀏覽器內，沒有帳戶，也沒有雲端同步。",
    "使用相機或相片讀取時，只有該張相片會暫時送出讀取；不會儲存在伺服器。",
    "本應用程式內容僅供參考，不能取代醫生診斷。",
  ],
  dashboard: [
    "健康紀錄只保存在此裝置；匯出 CSV 後，檔案由您自行保管。",
    "生成健康摘要時只會傳送最新讀數及評級，不會傳送日期、年齡或性別。",
    "本應用程式內容僅供參考，不能取代醫生診斷。",
  ],
  module: [
    "健康紀錄只保存在此裝置的瀏覽器內。",
    "如使用圖片讀取，只有該張相片會暫時送出讀取；確認儲存前請先核對所有數值。",
    "本應用程式內容僅供參考，不能取代醫生診斷。",
  ],
  summary: [
    "健康紀錄只保存在此裝置的瀏覽器內。",
    "生成摘要時只會傳送最新讀數及評級，不會傳送日期、年齡或性別。",
    "本應用程式內容僅供參考，不能取代醫生診斷。",
  ],
};

const ICONS = [ShieldCheck, Camera, FileText] as const;

export function PrivacyNotice({ context }: { context: NoticeContext }) {
  return (
    <aside className="rounded-2xl border border-border bg-card/70 p-5 text-base text-muted-foreground">
      <ul className="space-y-3">
        {COPY[context].map((line, index) => {
          const Icon = ICONS[index] ?? ShieldCheck;
          return (
            <li key={line} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
              <span>{line}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}