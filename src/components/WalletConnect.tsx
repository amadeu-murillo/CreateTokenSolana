"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletConnect() {
  return (
    <div className="flex justify-end mb-4">
      <WalletMultiButton />
    </div>
  );
}
