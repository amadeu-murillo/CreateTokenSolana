"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCluster } from "@/context/WalletContext";

export interface ArweaveUploadResult {
  imageUri: string;
  metadataUri?: string;
  provider: "arweave-irys" | "cloudinary";
}

/**
 * Uploads the token image via the server API (/api/upload-image), which automatically
 * uses Arweave/Irys when configured and falls back to guaranteed HTTPS CDN hosting
 * so images NEVER fail to appear on Devnet or Mainnet-Beta.
 */
export const useArweaveUpload = () => {
  const wallet = useWallet();
  const { cluster } = useCluster();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImageDecentralized = useCallback(
    async (
      file: File,
      mode: "wallet-irys" | "server-irys" = "server-irys"
    ): Promise<string | null> => {
      setIsUploading(true);
      setUploadProgress(15);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("network", cluster);
        formData.append("storage", mode === "wallet-irys" ? "arweave" : "cloudinary");

        setUploadProgress(55);
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
  };
};
