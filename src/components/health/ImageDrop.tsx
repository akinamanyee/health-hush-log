import { useCallback, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

// Drag-and-drop image upload for AI extraction. Images are downscaled in the
// browser, sent to the server function, and never stored anywhere.
async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法處理圖片");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ImageDrop({
  busy,
  onImage,
}: {
  busy: boolean;
  onImage: (dataUrl: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const handle = useCallback(
    async (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("請選擇相片檔案。");
        return;
      }
      try {
        const dataUrl = await downscale(file);
        onImage(dataUrl);
      } catch {
        setError("無法處理這張相片，請重新拍攝或改用手動輸入。");
      }
    },
    [onImage],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handle(e.dataTransfer.files?.[0]);
      }}
      className={`flex min-h-44 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-colors ${
        dragging ? "border-accent bg-secondary" : "border-input bg-card/60"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {busy ? (
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      ) : (
        <ImagePlus className="size-8 text-muted-foreground" />
      )}
      <span className="text-base text-muted-foreground">
        {busy ? "正在讀取圖片⋯" : "拍攝或上載儀器屏幕相片，也可在桌面拖放到這裡。"}
      </span>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="min-h-14 rounded-xl text-base"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-5" /> 用相機拍攝
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-14 rounded-xl text-base"
          onClick={() => uploadRef.current?.click()}
        >
          <Upload className="size-5" /> 上載照片
        </Button>
      </div>
      {error && <p className="text-base text-destructive">{error}</p>}
    </div>
  );
}
