/**
 * Client-side token logo optimizer using native browser Canvas API.
 * Resizes logos to max 512x512px and compresses to WebP under 95 KiB
 * so uploads hit the Irys (< 100 KiB) free tier and complete much faster.
 */

export const IRYS_FREE_TIER_TARGET_BYTES = 95 * 1024; // 95 KiB (safely under 100 KiB Irys free limit)
export const MAX_LOGO_DIMENSION = 512;

export interface OptimizedImageResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  wasOptimized: boolean;
  width: number;
  height: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image for optimization."));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export async function optimizeTokenLogo(
  file: File,
  targetMaxBytes: number = IRYS_FREE_TIER_TARGET_BYTES
): Promise<OptimizedImageResult> {
  // Preserve animated GIFs as-is to avoid stripping animation frames
  if (typeof window === "undefined" || file.type === "image/gif") {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      wasOptimized: false,
      width: 0,
      height: 0,
    };
  }

  try {
    const img = await loadImageElement(file);
    const srcWidth = img.naturalWidth || img.width || MAX_LOGO_DIMENSION;
    const srcHeight = img.naturalHeight || img.height || MAX_LOGO_DIMENSION;

    // If already small enough (< 95 KiB), WebP/PNG/JPG, and within 512x512, skip re-encoding
    if (
      file.type !== "image/svg+xml" &&
      file.size <= targetMaxBytes &&
      srcWidth <= MAX_LOGO_DIMENSION &&
      srcHeight <= MAX_LOGO_DIMENSION
    ) {
      return {
        file,
        originalSize: file.size,
        optimizedSize: file.size,
        wasOptimized: false,
        width: srcWidth,
        height: srcHeight,
      };
    }

    const dimensionSteps = [MAX_LOGO_DIMENSION, 384, 256];
    const qualitySteps = [0.88, 0.78, 0.68, 0.56, 0.45];

    let bestBlob: Blob | null = null;
    let finalWidth = srcWidth;
    let finalHeight = srcHeight;
    let outputMime = "image/webp";

    for (const maxDim of dimensionSteps) {
      const scale = Math.min(1, maxDim / Math.max(srcWidth, srcHeight));
      finalWidth = Math.max(1, Math.round(srcWidth * scale));
      finalHeight = Math.max(1, Math.round(srcHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) break;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, finalWidth, finalHeight);
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      for (const quality of qualitySteps) {
        let blob = await canvasToBlob(canvas, "image/webp", quality);
        if (!blob || blob.type !== "image/webp") {
          outputMime = "image/jpeg";
          blob = await canvasToBlob(canvas, "image/jpeg", quality);
        }

        if (blob) {
          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
          }
          if (blob.size <= targetMaxBytes) {
            bestBlob = blob;
            break;
          }
        }
      }

      if (bestBlob && bestBlob.size <= targetMaxBytes) {
        break;
      }
    }

    if (!bestBlob || (file.type !== "image/svg+xml" && bestBlob.size >= file.size)) {
      return {
        file,
        originalSize: file.size,
        optimizedSize: file.size,
        wasOptimized: false,
        width: srcWidth,
        height: srcHeight,
      };
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "") || "token-logo";
    const ext = outputMime === "image/webp" ? "webp" : "jpg";
    const optimizedFile = new File([bestBlob], `${baseName}.${ext}`, {
      type: outputMime,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
      wasOptimized: true,
      width: finalWidth,
      height: finalHeight,
    };
  } catch {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      wasOptimized: false,
      width: 0,
      height: 0,
    };
  }
}

/**
 * Alias for optimizeTokenLogo returning OptimizedImageResult (used by Token Form & Arweave uploader).
 */
export const optimizeTokenImageFile = optimizeTokenLogo;

/**
 * Converts a raw SVG string (512x512) into an optimized WebP File (< 95 KiB) in the browser.
 */
export async function convertSvgStringToWebpFile(
  svgString: string,
  baseName = "ai-token-logo"
): Promise<File> {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const rawFile = new File([svgBlob], `${baseName}.svg`, {
    type: "image/svg+xml",
    lastModified: Date.now(),
  });
  const optimized = await optimizeTokenImageFile(rawFile, IRYS_FREE_TIER_TARGET_BYTES);
  return optimized.file;
}
