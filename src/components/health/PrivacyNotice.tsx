import { Camera, FileText, ShieldCheck } from "lucide-react";

type NoticeContext = "cover" | "module" | "summary" | "dashboard";

const COPY: Record<Exclude<NoticeContext, "cover">, string[]> = {
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

function CoverNotice() {
  return (
    <div className="space-y-5 text-base leading-relaxed">
      <p>
        「健康紀錄簿」極度重視並致力保障您的個人私隱，所有資料處理均符合香港《個人資料（私隱）條例》之要求。請您在開始使用前閱讀以下資料處理原則：
      </p>

      <section>
        <h3 className="font-semibold">100% 本地儲存，無雲端備份</h3>
        <p className="mt-1 text-muted-foreground">
          您的所有健康紀錄（包含日期及各項測量數值）均僅儲存於您目前使用的設備（手機或電腦）及瀏覽器內。本應用程式無需註冊，亦絕對不會將您的長期健康紀錄上傳、同步或儲存至任何外部伺服器或資料庫。
        </p>
      </section>

      <section>
        <h3 className="font-semibold">⚠️ 請勿包含個人識別資料</h3>
        <p className="mt-1 text-muted-foreground">
          為進一步保障您的私隱，在使用相片讀取功能或手動輸入資料時，請確保不要包含任何可識別您身份的敏感資料（例如：您的姓名、身份證號碼、包含您樣貌的相片背景或任何醫療檔案號碼）。本系統完全匿名運作，絕不需要亦不會收集這些個人資訊。
        </p>
      </section>

      <section>
        <h3 className="font-semibold">安全且短暫的 AI 第三方處理</h3>
        <p className="mt-1 text-muted-foreground">
          為了提供更便利的紀錄體驗，本應用程式使用了 Google 的人工智能服務協助處理以下兩項即時功能：
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-muted-foreground">
          <li>
            <strong>相片數值讀取 (OCR)：</strong>當您拍攝或上傳儀器屏幕相片時，相片會被短暫傳送至伺服器以辨識數字。
          </li>
          <li>
            <strong>健康總結生成：</strong>當您索取健康總結時，系統僅會將「最新的數值及評分結果」短暫傳送至伺服器以生成易讀的文字。
          </li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          <strong>保障承諾：</strong>上述資料傳送為單次、匿名且即時的加密處理。您的相片及數值在處理完成後會立即被系統徹底銷毀，絕不會被儲存、外洩或用作任何 AI 系統的模型訓練。
        </p>
      </section>

      <section>
        <h3 className="font-semibold">資料自主與刪除</h3>
        <p className="mt-1 text-muted-foreground">
          由於所有資料均存放於您的個人設備中，您擁有完全的控制權。您可以隨時使用應用程式內的「清除資料」功能，一鍵永久刪除所有紀錄，一旦刪除將無法復原。
        </p>
      </section>

      <section>
        <h3 className="font-semibold">醫療免責聲明</h3>
        <p className="mt-1 text-muted-foreground">
          本應用程式所提供的所有參考標準、評分等級及健康總結僅供參考，不能取代醫生診斷。所有分級均直接對照官方衛生機構的標準圖表得出。如對身體狀況有任何疑問，請務必諮詢註冊醫生或專業醫護人員。
        </p>
      </section>
    </div>
  );
}

export function PrivacyNotice({ context }: { context: NoticeContext }) {
  if (context === "cover") {
    return (
      <aside className="rounded-2xl border border-border bg-card/70 p-5">
        <CoverNotice />
      </aside>
    );
  }

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
