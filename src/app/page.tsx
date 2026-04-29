"use client";

import { useState } from "react";
import CompressPanel from "@/features/image/CompressPanel";
import SvgPanel from "@/features/svg/SvgPanel";

type Tab = "image" | "svg";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "image",
    label: "Image Compress",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <rect x="1" y="1" width="12" height="12" rx="1.5" />
        <path d="M3 9l3-3 2 2 3-4" />
      </svg>
    ),
  },
  // {
  //   id: "svg",
  //   label: "SVG Optimizer",
  //   icon: (
  //     <svg
  //       width="14"
  //       height="14"
  //       viewBox="0 0 14 14"
  //       fill="none"
  //       stroke="currentColor"
  //       strokeWidth="1.2"
  //       strokeLinecap="round"
  //     >
  //       <path d="M7 1l2 3.5H5L7 1z" />
  //       <rect x="3" y="8" width="8" height="5" rx="1" />
  //       <path d="M5 11h4M5 12.5h2.5" />
  //     </svg>
  //   ),
  // },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("image");

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar (desktop) ──────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex-col py-5 px-4 flex-shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-3 mb-6 font-serif text-[18px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          Pix<span className="font-light italic">Forge</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
                tab === id
                  ? "bg-[var(--color-bg-info)] text-[var(--color-text-info)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-3">
          <span className="text-sm font-mono text-[var(--color-text-tertiary)]">
            v1.0.0
          </span>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Mobile tab bar */}
          <div className="flex md:hidden gap-2 mb-5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? "bg-[var(--color-bg-info)] text-[var(--color-text-info)]"
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-lg font-medium text-[var(--color-text-primary)]">
              {tab === "image" ? "Image Compressor" : "SVG Optimizer"}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {tab === "image"
                ? "Resize and re-encode images directly in your browser — nothing is uploaded."
                : "Minify and clean SVG files with SVGO — processed locally, stays private."}
            </p>
          </div>

          {/* Feature panel */}
          {tab === "image" ? <CompressPanel /> : <SvgPanel />}
        </div>
      </main>
    </div>
  );
}
