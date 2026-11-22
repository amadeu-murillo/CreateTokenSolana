"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCluster } from "@/context/WalletContext";
import { optimizeTokenLogo } from "@/lib/utils/imageOptimizer";
import {
  uploadImageWithUserWallet,
  uploadMetadataJsonWithUserWallet,
} from "@/lib/solana/clientIrysUploader";

export interface ArweaveUploadResult {
  imageUri: string;
  metadataUri?: string;
  provider: "arweave-irys" | "cloudinary";
}

/**
 * Optimizes the token logo client-side (< 95 KiB / 512px WebP) and uploads directly to Arweave/Irys
 * using the user's connected Solana wallet (no server-side IRYS_UPLOADER_PRIVATE_KEY required).
 * Falls back to /api/upload-image (Cloudinary) if wallet-irys is unavailable or mode is "server-irys".
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
      mode: "wallet-irys" | "server-irys" = "wallet-irys"
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

        // 1. Direct user-wallet upload to Irys (no external/server funding wallet needed)
        if (mode === "wallet-irys" && wallet.connected && wallet.publicKey) {
          try {
            setUploadProgress(60);
            const irysResult = await uploadImageWithUserWallet({
              file: optimized.file,
              wallet,
              cluster,
            });
            setUploadProgress(100);
            return irysResult.arweaveUri;
          } catch (walletIrysErr) {
            console.warn(
              "User-wallet Irys upload failed, falling back to /api/upload-image:",
              walletIrysErr
            );
          }
        }

        // 2. Fallback to /api/upload-image (Cloudinary HTTPS CDN)
        const formData = new FormData();
        formData.append("file", optimized.file);
        formData.append("network", cluster);
        formData.append("storage", mode === "wallet-irys" ? "arweave" : "cloudinary");

        setUploadProgress(75);
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

  const uploadMetadataDecentralized = useCallback(
    async (metadata: Record<string, unknown>): Promise<string | null> => {
      if (!wallet.connected || !wallet.publicKey) {
        return null;
      }
      try {
        const result = await uploadMetadataJsonWithUserWallet({
          metadata,
          wallet,
          cluster,
        });
        return result.metadataUri;
      } catch (err) {
        console.warn("User-wallet Irys metadata JSON upload failed:", err);
        return null;
      }
    },
    [wallet, cluster]
  );

  return {
    uploadImageDecentralized,
    uploadMetadataDecentralized,
    isUploading,
    uploadProgress,
    uploadError,
    setUploadError,
    optimizationSummary,
  };
};
