"use client";

import Dropzone from "@/components/Dropzone";
import { useCompressStore } from "./useCompressStore";

const FORMAT_OPTIONS = [
  { label: "WebP", value: "image/webp" as const },
  { label: "JPG", value: "image/jpeg" as const },
  { label: "PNG", value: "image/png" as const },
];

export function ControlPanel() {
  const config = useCompressStore((s) => s.config);
  const setFormat = useCompressStore((s) => s.setFormat);
  const setQuality = useCompressStore((s) => s.setQuality);
  const setScale = useCompressStore((s) => s.setScale);
  const compress = useCompressStore((s) => s.compress);
  const isProcessing = useCompressStore((s) => s.isProcessing);
  const error = useCompressStore((s) => s.error);

  return (
    <div className="flex flex-col gap-4">
      {/* Settings card */}
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-4">
        {/* Output format */}
        <div>
          <div className="section-label mb-2">Output Format</div>
          <div className="flex gap-2 flex-wrap">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  config.format === opt.value
                    ? "bg-[var(--color-bg-info)] text-[var(--color-text-info)] border-transparent"
                    : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* {config.format === "image/png" && (
            <p className="mt-2 text-sm bg-[var(--color-bg-info)]/10 text-[var(--color-text-info)] rounded-md px-2.5 py-1.5">
              PNG uses color quantization — lower quality = fewer colors =
              smaller file.
            </p>
          )} */}
        </div>

        {/* Quality slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="section-label">Quality</div>
            <span className="text-sm font-mono text-[var(--color-text-info)] font-medium">
              {Math.round(config.quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={config.quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-[var(--color-text-info)]"
          />
        </div>

        {/* Scale slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="section-label">Scale</div>
            <span className="text-sm font-mono text-[var(--color-text-secondary)]">
              {Math.round(config.scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={config.scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full accent-[var(--color-text-info)]"
          />
        </div>
      </div>

      {/* Dropzone */}
      <Dropzone
        onFiles={(files) => compress(files)}
        accept="image/*"
        multiple
      />

      {/* Processing */}
      {isProcessing && (
        <div className="text-center text-sm text-[var(--color-text-secondary)] py-3 animate-pulse">
          Processing…
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm bg-[var(--color-bg-warning)] text-[var(--color-text-warning)] rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
