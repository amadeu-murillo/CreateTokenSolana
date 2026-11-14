"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import Image from "next/image";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./ConnectWallet.module.css";

const WalletSvgIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const SwitchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="17 1 21 5 17 9"></polyline>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
    <polyline points="7 23 3 19 7 15"></polyline>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
  </svg>
);

const DisconnectIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function ConnectWallet() {
  const { connected, publicKey, wallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const { cluster, getExplorerUrl } = useCluster();
  const { t } = useLanguage();

  const [isClient, setIsClient] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch live wallet SOL balance whenever wallet or active cluster changes
  useEffect(() => {
    if (!connected || !publicKey || !connection) {
      setSolBalance(null);
      return;
    }
    let mounted = true;
    const fetchBal = () => {
      connection
        .getBalance(publicKey, "confirmed")
        .then((lamports) => {
          if (mounted) setSolBalance(lamports / LAMPORTS_PER_SOL);
        })
        .catch(() => {
          if (mounted) setSolBalance(null);
        });
    };
    fetchBal();
    const timer = setInterval(fetchBal, 12_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [connected, publicKey, connection, cluster]);

  const handleOpenWalletModal = useCallback(() => {
    setDropdownOpen(false);
    setVisible(true);
  }, [setVisible]);

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58()).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  }, [publicKey]);

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

  const isDevnet = cluster === "devnet";
  const statusIndicatorClass = connecting
    ? styles.statusConnecting
    : isDevnet
      ? styles.statusConnectedDevnet
      : styles.statusConnectedMainnet;

  return (
    <div className={styles.container} ref={dropdownRef}>
      {!connected || !publicKey ? (
        <button
          type="button"
          onClick={handleOpenWalletModal}
          disabled={connecting}
          className={styles.connectButton}
        >
          <WalletSvgIcon />
          <span>{connecting ? t.wallet.connecting : t.wallet.connect}</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            className={
              isDevnet ? styles.connectedButtonDevnet : styles.connectedButtonMainnet
            }
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <span className={`${styles.statusIndicator} ${statusIndicatorClass}`} />
            {wallet?.adapter.icon && (
              <Image
                src={wallet.adapter.icon}
                alt={`${wallet.adapter.name} icon`}
                width={20}
                height={20}
                unoptimized
                className={styles.walletIcon}
              />
            )}
            {solBalance !== null && (
              <span className={styles.solBalanceChip}>{solBalance.toFixed(3)} SOL</span>
            )}
            <span>
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </span>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownWalletTitle}>
                  {wallet?.adapter.icon && (
                    <Image
                      src={wallet.adapter.icon}
                      alt={`${wallet.adapter.name} icon`}
                      width={24}
                      height={24}
                      unoptimized
                      className={styles.walletIcon}
                    />
                  )}
                  <span>{wallet?.adapter.name || "Solana Wallet"}</span>
                </div>
                <span
                  className={
                    isDevnet ? styles.networkMiniBadgeDevnet : styles.networkMiniBadgeMainnet
                  }
                >
                  {isDevnet ? "DEVNET" : "MAINNET"}
                </span>
              </div>

              <div className={styles.balanceBox}>
                <span>
                  {t.wallet.balanceLabel} ({isDevnet ? "Devnet" : "Mainnet"}):
                </span>
                <strong>
                  {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "..."}
                </strong>
              </div>

              <div className={styles.dropdownAddress}>
                <span>
                  {publicKey.toBase58().slice(0, 14)}...{publicKey.toBase58().slice(-10)}
                </span>
              </div>

              <div className={styles.dropdownActions}>
                <button type="button" onClick={handleCopy} className={styles.menuActionBtn}>
                  <CopyIcon />
                  <span>{copySuccess ? t.wallet.copied : t.wallet.copyAddress}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWalletModal}
                  className={styles.menuActionBtn}
                >
                  <SwitchIcon />
                  <span>{t.wallet.changeWallet}</span>
                </button>

                <a
                  href={getExplorerUrl("account", publicKey.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.menuActionBtn}
                  onClick={() => setDropdownOpen(false)}
                >
                  <span>↗</span>
                  <span>{t.wallet.viewExplorer}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    disconnect();
                  }}
                  className={styles.disconnectButton}
                >
                  <DisconnectIcon />
                  <span>{t.wallet.disconnect}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
