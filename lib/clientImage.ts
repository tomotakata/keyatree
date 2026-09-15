"use client";

/**
 * クライアント側で画像ファイルを縮小し、data URL を返す。
 * スクショ貼り付け（Ctrl+V）や画像添付で、保存サイズを抑えるために使用する。
 */
export async function resizeImageToDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像のデコードに失敗しました"));
    image.src = dataUrl;
  });

  const { width, height } = img;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl; // フォールバック：元の data URL
  ctx.drawImage(img, 0, 0, w, h);

  // PNG（透過含む）は画質劣化を避けて PNG のまま、それ以外は JPEG で圧縮
  const isPng = file.type === "image/png";
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : quality);
}

/**
 * 任意のファイルを data URL に変換する（画像以外の添付に使用）。
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}
