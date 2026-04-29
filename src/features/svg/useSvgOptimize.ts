"use client";

import { useCallback, useState } from "react";
import { optimizeSvg, hasEmbeddedScript, type SvgPreset } from "@/lib/optimize";

export interface SvgOptimizeResult {
  originalSvg: string;
  optimizedSvg: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  hasEmbeddedScript: boolean;
}

export function useSvgOptimize() {
  const [result, setResult] = useState<SvgOptimizeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (svg: string, preset: SvgPreset) => {
    setIsProcessing(true);
    setError(null);
    try {
      const optimized = optimizeSvg(svg, preset);
      const originalSize = new Blob([svg]).size;
      const optimizedSize = new Blob([optimized]).size;
      setResult({
        originalSvg: svg,
        optimizedSvg: optimized,
        originalSize,
        optimizedSize,
        savingsPercent: Math.max(
          0,
          Math.round(((originalSize - optimizedSize) / originalSize) * 100),
        ),
        hasEmbeddedScript: hasEmbeddedScript(svg),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize SVG");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isProcessing, error, optimize, clear };
}
