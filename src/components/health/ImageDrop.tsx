import { useCallback, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

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

  const handle = useCallback(
    async (file: File | undefined) => {
      if (!file || !file.type.startsWith("image/")) return;
      const dataUrl = await downscale(file);
      onImage(dataUrl);
    },
    [onImage],
  );

  return (
    <label
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
      className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition-colors ${
        dragging ? "border-accent bg-secondary" : "border-input bg-card/60"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
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
        {busy ? "正在讀取圖片⋯" : "拖放屏幕照片到這裡，或點擊選擇"}
      </span>
    </label>
  );
}
