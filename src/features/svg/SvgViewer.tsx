"use client";

type View = "preview" | "code" | "diff";

interface SvgViewerProps {
  svgString: string;
  originalSvg?: string;
  view: View;
}

export default function SvgViewer({
  svgString,
  originalSvg,
  view,
}: SvgViewerProps) {
  if (view === "preview") {
    // Safe rendering: <img> with data URL prevents any embedded <script> from executing
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    return (
      <div className="w-full min-h-36 flex items-center justify-center bg-[var(--color-bg-secondary)] rounded-lg p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="SVG preview"
          className="max-w-full max-h-56 object-contain"
        />
      </div>
    );
  }

  if (view === "code") {
    return (
      <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-auto max-h-64">
        <pre className="p-3 text-[11px] font-mono text-[var(--color-text-secondary)] whitespace-pre leading-relaxed">
          {svgString}
        </pre>
      </div>
    );
  }

  if (view === "diff" && originalSvg) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="section-label mb-1">Original</div>
          <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-auto max-h-52">
            <pre className="p-2.5 text-sm font-mono text-[var(--color-text-secondary)] whitespace-pre leading-relaxed">
              {originalSvg}
            </pre>
          </div>
        </div>
        <div>
          <div className="section-label mb-1">Optimized</div>
          <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-auto max-h-52">
            <pre className="p-2.5 text-sm font-mono text-[var(--color-text-success)] whitespace-pre leading-relaxed">
              {svgString}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
