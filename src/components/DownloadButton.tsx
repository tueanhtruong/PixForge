"use client";

interface DownloadButtonProps {
  blob: Blob;
  fileName: string;
  label?: string;
}

export default function DownloadButton({
  blob,
  fileName,
  label = "Download",
}: DownloadButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    // Revoke after the browser has had a chance to use the URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      onClick={handleClick}
      className="flex-shrink-0 text-sm px-3 py-2 rounded-md border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)] transition-colors"
    >
      {label}
    </button>
  );
}
