"use client";

import { useEffect, useRef, useState } from "react";
import DownloadButton from "@/components/DownloadButton";
import { compressWithWorker } from "@/lib/compress";
import { type CompressResult, useCompressStore } from "./useCompressStore";

interface CompressResultItemProps {
  result: CompressResult;
  isSelected: boolean;
  onSelect: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressResultItem({
  result,
  isSelected,
  onSelect,
}: CompressResultItemProps) {
  const config = useCompressStore((s) => s.config);
  const setDownloadName = useCompressStore((s) => s.setDownloadName);
  const removeResult = useCompressStore((s) => s.removeResult);

  const [liveBlob, setLiveBlob] = useState<Blob>(result.compressedBlob);
  const liveSizeRef = useRef<number>(result.compressedSize);
  const livePercentRef = useRef<number>(result.savingsPercent);

  const ext =
    config.format === "image/jpeg"
      ? "jpg"
      : config.format === "image/webp"
        ? "webp"
        : "png";

  const [nameInput, setNameInput] = useState(() =>
    result.downloadName.replace(/\.[^.]+$/, ""),
  );
  const [isEstimating, setIsEstimating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cancelToken = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Sync base name when downloadName changes externally (e.g. format change)
  useEffect(() => {
    if (!isEditingName)
      setNameInput(result.downloadName.replace(/\.[^.]+$/, ""));
  }, [result.downloadName, isEditingName]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setDownloadName(result.id, `${trimmed}.${ext}`);
    else setNameInput(result.downloadName.replace(/\.[^.]+$/, ""));
    setIsEditingName(false);
  };

  // Live size estimate reacting to config changes
  useEffect(() => {
    cancelToken.current = { cancelled: false };
    const token = cancelToken.current;
    setIsEstimating(true);
    const timer = setTimeout(async () => {
      try {
        const blob = await compressWithWorker(result.originalFile, {
          quality: config.quality,
          format: config.format,
          scale: config.scale < 1 ? config.scale : undefined,
        });
        if (!token.cancelled) {
          setLiveBlob(blob);
          liveSizeRef.current = blob.size;
          livePercentRef.current = Math.max(
            0,
            Math.round(
              ((result.originalSize - blob.size) / result.originalSize) * 100,
            ),
          );
        }
      } catch {
        // keep previous value
      } finally {
        if (!token.cancelled) setIsEstimating(false);
      }
    }, 300);
    return () => {
      token.cancelled = true;
      clearTimeout(timer);
    };
  }, [config, result]);

  return (
    <div
      className={`bg-[var(--color-bg)] border rounded-lg p-3 flex flex-col gap-2 cursor-pointer transition-colors ${
        isSelected
          ? "border-[var(--color-text-info)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-secondary)]"
      }`}
      onClick={onSelect}
    >
      {/* Row 1: thumbnail + size info + clear */}
      <div className="flex items-center gap-3">
        {/* Thumbnail */}
        <div className="w-8 h-8 rounded bg-[var(--color-bg-secondary)] flex-shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.compressedUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {result.originalFile.name}
          </div>
          <div
            className={`text-sm mt-1 flex items-center gap-1 transition-opacity ${isEstimating ? "opacity-50" : "opacity-100"}`}
          >
            <span className="text-[var(--color-text-tertiary)]">
              {formatSize(result.originalSize)}
            </span>
            <span className="text-[var(--color-text-tertiary)]">→</span>
            <span className="text-[var(--color-text-success)] font-medium">
              {formatSize(liveSizeRef.current)}
            </span>
            {livePercentRef.current > 0 && (
              <span className="text-[var(--color-text-success)]">
                · -{livePercentRef.current}%
              </span>
            )}
            {isEstimating && (
              <span className="text-[var(--color-text-tertiary)] animate-pulse">
                …
              </span>
            )}
          </div>
        </div>

        {/* Clear button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeResult(result.id);
          }}
          className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-1"
          title="Remove"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>

      {/* Row 2: editable download name + download button */}
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditingName ? (
          <div className="flex items-center flex-1 min-w-0 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded focus-within:border-[var(--color-text-info)] transition-colors">
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameInput(result.downloadName.replace(/\.[^.]+$/, ""));
                  setIsEditingName(false);
                }
              }}
              className="flex-1 min-w-0 text-[14px] font-mono bg-transparent px-2 py-1 text-[var(--color-text-primary)] outline-none"
            />
            <span className="text-[14px] font-mono text-[var(--color-text-tertiary)] pr-2 flex-shrink-0">
              .{ext}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="flex-1 min-w-0 text-left text-[14px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] truncate transition-colors"
            title="Click to rename"
          >
            {result.downloadName}
            {/* Edit icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              width={16}
              height={16}
              fill="currentColor"
              className="inline-block ml-1"
            >
              <path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z" />
            </svg>
          </button>
        )}

        <DownloadButton blob={liveBlob} fileName={result.downloadName} />
      </div>
    </div>
  );
}
