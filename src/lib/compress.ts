export type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

import UPNG from "upng-js";

export interface CompressOptions {
  quality: number; // 0–1 (only affects jpeg/webp)
  format: OutputFormat;
  scale?: number; // 0.1–1.0, scales down image dimensions
  maxWidth?: number;
  maxHeight?: number;
}

interface WorkerResponse {
  id: string;
  buffer?: ArrayBuffer;
  outputMimeType?: string;
  error?: string;
}

/** Detect WebP support (iOS Safari < 16 does not support canvas.toBlob webp) */
export function isWebPSupported(): boolean {
  if (typeof document === "undefined") return false;
  return document
    .createElement("canvas")
    .toDataURL("image/webp")
    .startsWith("data:image/webp");
}

// --- Worker-based compression ---

let _worker: Worker | null = null;
const _pending = new Map<
  string,
  { resolve: (b: Blob) => void; reject: (e: Error) => void }
>();

function getCompressWorker(): Worker {
  if (_worker) return _worker;
  _worker = new Worker(new URL("./compress.worker.ts", import.meta.url));
  _worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const { id, buffer, outputMimeType, error } = e.data;
    const pending = _pending.get(id);
    if (!pending) return;
    _pending.delete(id);
    if (error) {
      pending.reject(new Error(error));
    } else if (buffer && outputMimeType) {
      pending.resolve(new Blob([buffer], { type: outputMimeType }));
    } else {
      pending.reject(new Error("Invalid worker response"));
    }
  };
  _worker.onerror = (e) => {
    _pending.forEach(({ reject }) =>
      reject(new Error(e.message || "Worker error")),
    );
    _pending.clear();
    _worker = null;
  };
  return _worker;
}

/**
 * Compress an image using a Web Worker (non-blocking).
 * Falls back to canvas on the main thread if Worker is unavailable.
 */
export async function compressWithWorker(
  file: File,
  options: CompressOptions,
): Promise<Blob> {
  if (typeof Worker === "undefined") {
    return compressWithCanvas(file, options);
  }
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    _pending.set(id, { resolve, reject });
    getCompressWorker().postMessage(
      {
        id,
        buffer,
        mimeType: file.type,
        options,
        webpSupported: isWebPSupported(),
      },
      [buffer],
    );
  });
}

/** Compress / convert an image using the Canvas API with a manual quality value. */
export function compressWithCanvas(
  file: File,
  options: CompressOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth;
      let targetHeight = img.naturalHeight;

      if (options.scale && options.scale < 1) {
        targetWidth = Math.round(targetWidth * options.scale);
        targetHeight = Math.round(targetHeight * options.scale);
      }
      if (options.maxWidth && targetWidth > options.maxWidth) {
        const ratio = options.maxWidth / targetWidth;
        targetWidth = options.maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
      }
      if (options.maxHeight && targetHeight > options.maxHeight) {
        const ratio = options.maxHeight / targetHeight;
        targetHeight = options.maxHeight;
        targetWidth = Math.round(targetWidth * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // iOS Safari fallback: WebP not supported before Safari 16
      let format = options.format;
      if (format === "image/webp" && !isWebPSupported()) {
        format = "image/jpeg";
      }

      if (format === "image/png") {
        // Lossy PNG: quantize colors using upng-js (k-means, like TinyPNG)
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const cnum = Math.max(2, Math.round(options.quality * 256));
        const pngBuffer = UPNG.encode(
          [imageData.data.buffer],
          targetWidth,
          targetHeight,
          cnum,
        );
        resolve(new Blob([pngBuffer], { type: "image/png" }));
      } else {
        const quality = options.quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("canvas.toBlob returned null"));
            }
          },
          format,
          quality,
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
