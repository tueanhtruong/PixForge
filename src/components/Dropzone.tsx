"use client";

import { useCallback, useRef, useState } from "react";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function Dropzone({
  onFiles,
  accept,
  multiple = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterFiles = useCallback(
    (raw: File[]) => {
      if (!accept) return raw;
      // Normalise accept string to regex: e.g. "image/*" → /^image\/.*/
      return raw.filter((f) => {
        return accept.split(",").some((pat) => {
          pat = pat.trim();
          if (pat.startsWith(".")) return f.name.endsWith(pat);
          const re = new RegExp("^" + pat.replace("*", ".*") + "$");
          return re.test(f.type);
        });
      });
    },
    [accept],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = filterFiles(Array.from(e.dataTransfer.files));
      if (files.length) onFiles(files);
    },
    [onFiles, filterFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = filterFiles(Array.from(e.target.files ?? []));
      if (files.length) onFiles(files);
      // Reset so same file can be re-uploaded
      e.target.value = "";
    },
    [onFiles, filterFiles],
  );

  const hint =
    accept === "image/*"
      ? "PNG, JPG, WebP"
      : accept?.includes("svg")
        ? "SVG files only"
        : (accept ?? "All files");

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-xl border flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors ${
        isDragging
          ? "border-[var(--color-text-info)] bg-[var(--color-bg-info)]"
          : "border-dashed border-[var(--color-border-secondary)] bg-[var(--color-bg)] hover:border-[var(--color-text-tertiary)]"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          className="text-[var(--color-text-tertiary)]"
        >
          <path d="M8 11V4M5 7l3-3 3 3" />
          <rect x="1" y="1" width="14" height="14" rx="2.5" />
        </svg>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {isDragging ? "Drop here" : "Drop files here or click to upload"}
      </p>
      <p className="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
