// Import from the browser-compatible entry point.
// The default 'svgo' main field resolves to svgo-node.js which requires 'fs'.
// svgo/lib/svgo.js is the CJS build without Node.js-only dependencies.
import { optimize } from "svgo/lib/svgo";

export type SvgPreset = "safe" | "aggressive";

/** Check if an SVG string contains embedded <script> tags. */
export function hasEmbeddedScript(svgString: string): boolean {
  return /<script[\s>/]/i.test(svgString);
}

/** Optimize an SVG string using SVGO with the chosen preset. */
export function optimizeSvg(svgString: string, preset: SvgPreset): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any =
    preset === "safe"
      ? {
          // Conservative: strip noise, never touch structure or viewBox
          plugins: [
            "removeDoctype",
            "removeXMLProcInst",
            "removeComments",
            "removeMetadata",
            "removeEmptyAttrs",
            "collapseGroups",
          ],
        }
      : {
          // Aggressive: full preset-default, but keep viewBox (required for responsive scaling)
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        };

  const result = optimize(svgString, config);
  return result.data;
}
