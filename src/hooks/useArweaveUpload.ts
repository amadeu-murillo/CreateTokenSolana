"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCluster } from "@/context/WalletContext";
import { optimizeTokenLogo } from "@/lib/utils/imageOptimizer";

export interface ArweaveUploadResult {
  imageUri: string;
  metadataUri?: string;
  provider: "arweave-irys" | "cloudinary";
}

/**
 * Optimizes the token logo client-side (< 95 KiB / 512px WebP) and uploads via /api/upload-image,
 * hitting the Irys free tier (< 100 KiB) with much faster transfer times and automatic HTTPS fallback.
 */
export const useArweaveUpload = () => {
  const wallet = useWallet();
  const { cluster } = useCluster();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [optimizationSummary, setOptimizationSummary] = useState<string | null>(null);

  const uploadImageDecentralized = useCallback(
    async (
      file: File,
      mode: "wallet-irys" | "server-irys" = "server-irys"
    ): Promise<string | null> => {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadError(null);
      setOptimizationSummary(null);

      try {
        const optimized = await optimizeTokenLogo(file);
        if (optimized.wasOptimized) {
          const origKb = Math.round(optimized.originalSize / 1024);
          const nextKb = Math.round(optimized.optimizedSize / 1024);
          setOptimizationSummary(`${origKb} KB → ${nextKb} KB (${optimized.width}x${optimized.height})`);
        }

        setUploadProgress(35);
        const formData = new FormData();
        formData.append("file", optimized.file);
        formData.append("network", cluster);
        formData.append("storage", mode === "wallet-irys" ? "arweave" : "cloudinary");

        setUploadProgress(60);
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok || !data.secure_url) {
          throw new Error(data.error || "Failed to upload token image.");
        }

        setUploadProgress(100);
        return data.secure_url as string;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload token image.";
        setUploadError(message);
        return null;
      } finally {
        setTimeout(() => setIsUploading(false), 300);
      }
    },
    [wallet, cluster]
  );

  return {
    uploadImageDecentralized,
    isUploading,
    uploadProgress,
    uploadError,
    setUploadError,
    optimizationSummary,
  };
};
