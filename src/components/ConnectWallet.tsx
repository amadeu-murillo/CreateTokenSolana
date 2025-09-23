"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import styles from "./ConnectWallet.module.css";

export default function ConnectWallet() {
  const { connected, publicKey } = useWallet();

  if (connected && publicKey) {
    return (
      <div className={styles.container}>
        <p className={styles.address}>
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return <WalletMultiButton>Conectar Carteira</WalletMultiButton>;
}
