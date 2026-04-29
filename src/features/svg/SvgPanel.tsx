"use client";

import { useCallback, useState } from "react";
import { useSvgOptimize } from "./useSvgOptimize";
import SvgViewer from "./SvgViewer";
import Dropzone from "@/components/Dropzone";
import DownloadButton from "@/components/DownloadButton";
import { type SvgPreset } from "@/lib/optimize";

type View = "preview" | "code" | "diff";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function SvgPanel() {
  const { result, isProcessing, error, optimize, clear } = useSvgOptimize();
  const [preset, setPreset] = useState<SvgPreset>("safe");
  const [fileName, setFileName] = useState("optimized.svg");
  const [activeView, setActiveView] = useState<View>("preview");
  const [copied, setCopied] = useState(false);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setFileName(file.name);
      const text = await file.text();
      await optimize(text, preset);
    },
    [optimize, preset],
  );

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.optimizedSvg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  const optimizedBlob = result
    ? new Blob([result.optimizedSvg], { type: "image/svg+xml" })
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Preset selector */}
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="section-label mb-2">Optimization Preset</div>
        <div className="flex gap-2">
          {(["safe", "aggressive"] as SvgPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-full text-sm border capitalize transition-colors ${
                preset === p
                  ? "bg-[var(--color-bg-info)] text-[var(--color-text-info)] border-transparent"
                  : "border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
          {preset === "safe"
            ? "Conservative plugins only — safe for all SVGs."
            : "Uses preset-default — may alter complex paths and shapes."}
        </p>
      </div>

      {/* Dropzone or back link */}
      {!result ? (
        <Dropzone onFiles={handleFiles} accept=".svg,image/svg+xml" />
      ) : (
        <button
          onClick={() => {
            clear();
            setActiveView("preview");
          }}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors text-left"
        >
          ← Upload another file
        </button>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="text-center text-sm text-[var(--color-text-secondary)] py-3 animate-pulse">
          Optimizing…
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm bg-[var(--color-bg-warning)] text-[var(--color-text-warning)] rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Result */}
      {result && optimizedBlob && (
        <>
          {/* Security warning */}
          {result.hasEmbeddedScript && (
            <div className="bg-[var(--color-bg-warning)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-warning)]">
              ⚠ This SVG contains embedded &lt;script&gt; tags. Preview is
              rendered safely via <code>&lt;img&gt;</code>, but verify the file
              before use.
            </div>
          )}

          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4">
            {/* File info + actions */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {fileName}
                </div>
                <div className="text-sm text-[var(--color-text-success)] mt-1">
                  {formatSize(result.originalSize)} →{" "}
                  {formatSize(result.optimizedSize)}
                  {result.savingsPercent > 0 &&
                    ` · saved ${result.savingsPercent}%`}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleCopy}
                  className="text-sm px-2.5 py-1.5 rounded-md border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <DownloadButton
                  blob={optimizedBlob}
                  fileName={fileName.replace(/\.svg$/i, "_optimized.svg")}
                />
              </div>
            </div>

            {/* View tabs */}
            <div className="flex gap-1 mb-3">
              {(["preview", "code", "diff"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-2.5 py-1 rounded text-sm capitalize transition-colors ${
                    activeView === v
                      ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-medium"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <SvgViewer
              svgString={result.optimizedSvg}
              originalSvg={result.originalSvg}
              view={activeView}
            />
          </div>
        </>
      )}
    </div>
  );
}
