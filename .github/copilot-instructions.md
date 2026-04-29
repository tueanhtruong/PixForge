# PixForge — Project Guidelines

## Project Overview

PixForge is a client-side image utility web app built with **Next.js + React + TypeScript**.  
Two core tools:
- **Image Compressor** — resize/re-encode images in-browser (JPEG, WebP, PNG)
- **SVG Optimizer** — clean and minify SVG files via SVGO

All processing happens entirely client-side (no server uploads).

## Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Key libs**: `browser-image-compression`, `svgo` (v3, ESM), `dompurify`

## Architecture

Feature-sliced layout under `src/`:

```
src/
├── features/
│   ├── image/
│   │   ├── useImageCompress.ts   ← custom hook (Canvas API wrapper)
│   │   ├── CompressPanel.tsx
│   │   └── SplitPreview.tsx      ← before/after CSS clip-path slider
│   └── svg/
│       ├── useSvgOptimize.ts     ← custom hook (svgo wrapper)
│       ├── SvgPanel.tsx
│       └── SvgViewer.tsx
├── components/
│   ├── Dropzone.tsx              ← shared across both tools
│   └── DownloadButton.tsx
└── lib/
    ├── compress.ts               ← low-level Canvas API helpers
    └── optimize.ts               ← low-level svgo helpers
```

## Conventions

- Place business logic in `lib/`, expose it through feature hooks (`use*.ts`), render in `*Panel.tsx`
- Shared UI components (used by both features) live in `components/`
- Prefer `browser-image-compression` for automatic quality/size targeting; use Canvas API directly only when a manual quality slider is required

## Critical Gotchas

### Image Compression

- **`browser-image-compression` does not expose a quality slider** — it auto-adjusts quality to hit `maxSizeMB`. For a manual quality control UI, use Canvas API directly:
  ```ts
  canvas.toBlob((blob) => { /* download */ }, 'image/webp', quality) // quality: 0–1
  ```
- **PNG has no quality parameter** — PNG is lossless; file size depends entirely on content. Always inform the user of this in the UI.
- **iOS Safari / WebP**: `canvas.toBlob()` does not support `image/webp` before Safari 16. Detect support and fall back to JPEG:
  ```ts
  const webpSupported = document.createElement('canvas')
    .toDataURL('image/webp').startsWith('data:image/webp')
  ```
- **Large files (>5MB) freeze the UI** if Canvas runs on the main thread. `browser-image-compression` handles this with `useWebWorker: true`. For custom Canvas code, offload to a Web Worker manually.
- **Memory leaks with Object URLs**: always call `URL.revokeObjectURL()` when the component unmounts or the URL is no longer needed.

### SVG Optimizer

- **SVGO v3 is pure ESM** — bundles cleanly into Vite/Next.js without config.
- **Bundle size**: full SVGO import is ~400 KB. Import only the needed plugins if bundle size is a concern.
- **Aggressive plugins can break layouts** — `mergePaths` and `convertShapeToPath` may alter visual output. Offer two presets:
  - `Safe` — conservative plugins only (`removeDoctype`, `removeComments`, `removeMetadata`, `removeEmptyAttrs`, `collapseGroups`)
  - `Aggressive` — includes `mergePaths`, `convertShapeToPath`, etc.
- **Never set `removeViewBox: true`** by default — viewBox is required for responsive scaling.
- **SVG preview security**: render via `<img src="data:image/svg+xml,...">`, NOT `innerHTML`, to prevent embedded `<script>` execution. If DOM injection is needed for inspect/zoom, sanitize first:
  ```ts
  import DOMPurify from 'dompurify'
  const clean = DOMPurify.sanitize(svgString, { USE_PROFILES: { svg: true } })
  container.innerHTML = clean
  ```

### Split-view Preview

Before/after image comparison uses **CSS `clip-path` + a range `<input>` overlaid on top** — no third-party library needed.

## Build & Dev Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run lint      # ESLint
```
