"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import styles from "./ConnectWallet.module.css";
import Image from "next/image";

// Ícones SVG para o menu
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const DisconnectIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;


export default function ConnectWallet() {
  const { connected, publicKey, wallet, disconnect } = useWallet();
  const [isClient, setIsClient] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58()).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  }, [publicKey]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isClient) {
    return <div className={styles.placeholderButton}></div>;
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      {!connected || !publicKey ? (
         <WalletMultiButton className={styles.connectButton} />
      ) : (
        <>
          <button className={styles.connectedButton} onClick={() => setDropdownOpen(prev => !prev)}>
            {wallet?.adapter.icon && (
                <Image src={wallet.adapter.icon} alt={`${wallet.adapter.name} icon`} width={24} height={24} className={styles.walletIcon} />
            )}
            <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                    {wallet?.adapter.icon && (
                        <Image src={wallet.adapter.icon} alt={`${wallet.adapter.name} icon`} width={28} height={28} className={styles.walletIcon} />
                    )}
                    <span>{wallet?.adapter.name}</span>
                </div>
                <div className={styles.dropdownAddress}>
                    <p>{publicKey.toBase58()}</p>
                    <button onClick={handleCopy} title="Copiar Endereço">
                        {copySuccess ? 'Copiado!' : <CopyIcon />}
                    </button>
                </div>
                <button onClick={disconnect} className={styles.disconnectButton}>
                    <DisconnectIcon />
                    <span>Desconectar</span>
                </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
