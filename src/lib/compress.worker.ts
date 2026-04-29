// Web Worker for image compression using OffscreenCanvas.
// self is cast to `any` because TypeScript's dom lib types it as Window,
// but at runtime this file runs as a DedicatedWorkerGlobalScope.
/* eslint-disable @typescript-eslint/no-explicit-any */
import UPNG from "upng-js";

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

interface CompressOptions {
  quality: number;
  format: OutputFormat;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface WorkerRequest {
  id: string;
  buffer: ArrayBuffer;
  mimeType: string;
  options: CompressOptions;
  webpSupported: boolean;
}

interface WorkerResponse {
  id: string;
  buffer?: ArrayBuffer;
  outputMimeType?: string;
  error?: string;
}

(self as any).onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, buffer, mimeType, options, webpSupported } = e.data;
  try {
    const blob = new Blob([buffer], { type: mimeType });
    const bitmap = await createImageBitmap(blob);

    let targetWidth = bitmap.width;
    let targetHeight = bitmap.height;

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

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    let format: OutputFormat = options.format;
    if (format === "image/webp" && !webpSupported) {
      format = "image/jpeg";
    }

    let outputBuffer: ArrayBuffer;

    if (format === "image/png") {
      // Lossy PNG: quantize colors using upng-js (k-means, like TinyPNG)
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const cnum = Math.max(2, Math.round(options.quality * 256));
      outputBuffer = UPNG.encode(
        [imageData.data.buffer],
        targetWidth,
        targetHeight,
        cnum,
      );
    } else {
      const quality = options.quality;
      const outputBlob = await canvas.convertToBlob({ type: format, quality });
      outputBuffer = await outputBlob.arrayBuffer();
    }

    const response: WorkerResponse = {
      id,
      buffer: outputBuffer,
      outputMimeType: format,
    };
    (self as any).postMessage(response, [outputBuffer]);
  } catch (err) {
    const response: WorkerResponse = {
      id,
      error: err instanceof Error ? err.message : "Compression failed",
    };
    (self as any).postMessage(response);
  }
};
