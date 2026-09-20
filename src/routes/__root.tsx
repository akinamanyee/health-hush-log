import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">找不到此頁面</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          此頁面不存在或已移動。您的健康紀錄仍只保存在此裝置。
        </p>
        <div className="mt-6">
          <Link
            to="/logbook"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            返回健康紀錄簿
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          此頁面未能載入
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          發生錯誤，請重試或返回健康紀錄簿。您的健康紀錄仍只保存在此裝置。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            重試
          </button>
          <a
            href="/logbook"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            返回健康紀錄簿
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">本應用程式內容僅供參考，不能取代醫生診斷。</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "健康紀錄簿 — 本地優先健康日誌" },
      {
        name: "description",
        content:
          "本地優先的健康紀錄簿：記錄血壓、身體成份分析儀、手握力與坐地前伸測試讀數，資料只存在您的裝置上。",
      },
      { property: "og:title", content: "健康紀錄簿 — 本地優先健康日誌" },
      {
        property: "og:description",
        content:
          "記錄血壓、身體成份分析儀、手握力與坐地前伸測試讀數，資料只存在您的裝置上。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant-HK">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// A new deployment replaces the hashed route chunks, so a page still open from the
// previous build fails its dynamic import ("Importing a module script failed") and
// renders blank. Reload once to pick up the current chunks.
function useChunkReloadRecovery() {
  useEffect(() => {
    const RELOAD_FLAG = "hlb:chunk-reloaded";
    const recover = () => {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    };
    const onPreloadError = () => recover();
    const onRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
      if (/importing a module script failed|failed to fetch dynamically imported module/i.test(message)) {
        recover();
      }
    };
    window.addEventListener("vite:preloadError", onPreloadError);
    window.addEventListener("unhandledrejection", onRejection);
    sessionStorage.removeItem(RELOAD_FLAG);
    return () => {
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useChunkReloadRecovery();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
