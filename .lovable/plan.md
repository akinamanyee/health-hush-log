# Plan: Cloud Run 部署做法 — 風險覆核（不影響現有網頁應用）

## 覆核結論

做法安全，現有網頁應用不受影響。原因：

1. **Lovable 構建完全不變** — `vite.config.ts` 只在設定了 `NITRO_PRESET` 環境變數時才切換輸出格式。Lovable 這邊從不設定它，所以 Lovable 的預覽和發布構建與之前一模一樣（已實測：正常構建通過，頁面正常）。
2. **Dockerfile 只在 Cloud Run 構建時被使用** — Lovable 構建完全不理會 `Dockerfile` / `.dockerignore`，它們只是repo根目錄的兩個新檔案。
3. **沒有改動任何應用程式碼** — 四個紀錄模組、評級、CSV 匯出、AI 功能、封面、私隱連結，全部原封不動。改動的只有：新增 `Dockerfile`、`.dockerignore`、`vite.config.ts` 加一個條件判斷、README 加部署說明、CHANGELOG 記錄。

## 已驗證的事實

- Lovable 正常構建：通過（exit 0）。
- Node server 構建（Cloud Run 用的路徑）：在本機實測，頁面正常開啟（`/logbook` 回應 200，內容正確）。
- 預覽頁面：封面、`/logbook`、四個模組均正常運作。

## 兩個你需要知道的限制（不是風險，是設定）

1. **AI 功能在 Cloud Run 需要 `LOVABLE_API_KEY`** — 拍照讀數和 AI 摘要會在 Cloud Run 上失效，除非你在 Cloud Run 的環境變數設定這個 key。其他功能（記錄、評級、CSV 匯出）全部本地運行，不需要任何設定。
2. **GitHub 同步規則** — 切勿在 `main` 上 force push / rebase / amend / squash，否則破壞 Lovable 同步。

## 不做的事

- 不改任何功能、UI、資料邏輯。
- 不碰現有的 localStorage 資料結構。
- 不加資料庫、不加帳戶系統（維持 local-first 原則）。
