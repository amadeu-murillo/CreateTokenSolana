"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function ConnectWallet() {
  const { connected, publicKey } = useWallet();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm font-mono bg-muted text-muted-foreground px-3 py-1.5 rounded-md">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return <WalletMultiButton>Conectar Carteira</WalletMultiButton>;
}
