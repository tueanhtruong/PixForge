"use client";

import { useState } from "react";
import JSZip from "jszip";
import SplitPreview from "./SplitPreview";
import CompressResultItem from "./CompressResultItem";
import { ControlPanel } from "./ControlPanel";
import { useCompressStore } from "./useCompressStore";

export default function CompressPanel() {
  const results = useCompressStore((s) => s.results);
  const clearAll = useCompressStore((s) => s.clearAll);
  const selectedId = useCompressStore((s) => s.selectedId);
  const setSelectedId = useCompressStore((s) => s.setSelectedId);
  const [isZipping, setIsZipping] = useState(false);

  const selectedResult = results.find((r) => r.id === selectedId) ?? null;

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const r of results) {
        zip.file(r.downloadName, r.compressedBlob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed_images.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ControlPanel />

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="section-label">Results ({results.length})</div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="text-sm text-[var(--color-text-info)] hover:opacity-70 transition-opacity disabled:opacity-40"
              >
                {isZipping ? "Zipping…" : "Download all"}
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {results.map((r) => (
            <CompressResultItem
              key={r.id}
              result={r}
              isSelected={selectedId === r.id}
              onSelect={() => setSelectedId(r.id === selectedId ? null : r.id)}
            />
          ))}
        </div>
      )}

      {/* Split Preview */}
      {selectedResult && (
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3">
          <div className="section-label mb-2">Before / After</div>
          <SplitPreview
            originalUrl={selectedResult.originalUrl}
            compressedUrl={selectedResult.compressedUrl}
          />
        </div>
      )}
    </div>
  );
}
