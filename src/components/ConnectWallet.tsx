"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import styles from "./ConnectWallet.module.css";

export default function ConnectWallet() {
  const { connected, publicKey } = useWallet();

  // O botão da biblioteca já tem um bom estilo e lida com os estados conectado/desconectado.
  // Podemos adicionar nossa exibição de endereço personalizada para uma melhor UX em telas maiores.
  return (
      <div className={styles.container}>
        {connected && publicKey && (
            <p className={styles.address}>
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </p>
        )}
        <WalletMultiButton />
      </div>
  );
}
