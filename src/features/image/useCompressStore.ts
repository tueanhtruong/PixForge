import { create } from "zustand";
import {
  compressWithWorker,
  type CompressOptions,
  type OutputFormat,
} from "@/lib/compress";

export interface CompressResult {
  id: string;
  originalFile: File;
  compressedBlob: Blob;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  downloadName: string;
}

export interface CompressConfig {
  format: OutputFormat;
  quality: number;
  scale: number;
}

interface CompressStore {
  // Config
  config: CompressConfig;
  setFormat: (format: OutputFormat) => void;
  setQuality: (quality: number) => void;
  setScale: (scale: number) => void;

  // Results
  results: CompressResult[];
  isProcessing: boolean;
  error: string | null;

  // Selected for split preview
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  // Actions
  compress: (files: File[]) => Promise<void>;
  removeResult: (id: string) => void;
  setDownloadName: (id: string, name: string) => void;
  clearAll: () => void;
}

function formatExt(format: OutputFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

function buildDownloadName(file: File, format: OutputFormat): string {
  return `${file.name.replace(/\.[^.]+$/, "")}_compressed.${formatExt(format)}`;
}

export const useCompressStore = create<CompressStore>((set, get) => ({
  config: { format: "image/webp", quality: 0.8, scale: 1.0 },

  setFormat: (format) =>
    set((s) => ({
      config: { ...s.config, format },
      results: s.results.map((r) => ({
        ...r,
        downloadName: r.downloadName.replace(
          /\.[^.]+$/,
          `.${formatExt(format)}`,
        ),
      })),
    })),
  setQuality: (quality) => set((s) => ({ config: { ...s.config, quality } })),
  setScale: (scale) => set((s) => ({ config: { ...s.config, scale } })),

  results: [],
  isProcessing: false,
  error: null,
  selectedId: null,

  setSelectedId: (id) => set({ selectedId: id }),

  compress: async (files) => {
    const { config, results: existing, selectedId } = get();
    const options: CompressOptions = {
      quality: config.quality,
      format: config.format,
      scale: config.scale < 1 ? config.scale : undefined,
    };

    set({ isProcessing: true, error: null });
    const newResults: CompressResult[] = [];

    try {
      for (const file of files) {
        const compressedBlob = await compressWithWorker(file, options);
        const originalUrl = URL.createObjectURL(file);
        const compressedUrl = URL.createObjectURL(compressedBlob);

        newResults.push({
          id: crypto.randomUUID(),
          originalFile: file,
          compressedBlob,
          originalUrl,
          compressedUrl,
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          savingsPercent: Math.max(
            0,
            Math.round(((file.size - compressedBlob.size) / file.size) * 100),
          ),
          downloadName: buildDownloadName(file, config.format),
        });
      }

      set((s) => ({
        results: [...s.results, ...newResults],
        isProcessing: false,
        // auto-select first item if nothing selected
        selectedId:
          selectedId ?? (newResults.length > 0 ? newResults[0].id : null),
      }));
    } catch (err) {
      set({
        isProcessing: false,
        error: err instanceof Error ? err.message : "Compression failed",
      });
    }
  },

  removeResult: (id) => {
    const { results, selectedId } = get();
    const target = results.find((r) => r.id === id);
    if (target) {
      URL.revokeObjectURL(target.originalUrl);
      URL.revokeObjectURL(target.compressedUrl);
    }
    set({
      results: results.filter((r) => r.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  setDownloadName: (id, name) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.id === id ? { ...r, downloadName: name } : r,
      ),
    })),

  clearAll: () => {
    get().results.forEach((r) => {
      URL.revokeObjectURL(r.originalUrl);
      URL.revokeObjectURL(r.compressedUrl);
    });
    set({ results: [], selectedId: null, error: null });
  },
}));
