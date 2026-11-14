"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./TokenSelector.module.css";

export interface SelectableWalletToken {
  mint: string;
  amount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  logoURI?: string;
  programId?: string;
  isLpToken?: boolean;
  pairedBaseMint?: string;
}

interface TokenSelectorProps {
  tokens: SelectableWalletToken[];
  selectedTokenMint: string;
  onSelectToken: (mint: string) => void;
  isLoading: boolean;
  disabled: boolean;
  autoSelectFirst?: boolean;
  showQuickWalletCards?: boolean;
}

export const TokenSelector = ({
  tokens,
  selectedTokenMint,
  onSelectToken,
  isLoading,
  disabled,
  autoSelectFirst = true,
  showQuickWalletCards = true,
}: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-select the first token from the user's connected wallet when tokens load
  useEffect(() => {
    if (autoSelectFirst && !selectedTokenMint && tokens.length > 0 && !isLoading) {
      onSelectToken(tokens[0].mint);
    }
  }, [autoSelectFirst, selectedTokenMint, tokens, isLoading, onSelectToken]);

  const selectedToken = tokens.find((t) => t.mint === selectedTokenMint) || null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (mint: string) => {
    onSelectToken(mint);
    setIsOpen(false);
  };

  const formatMintShort = (mint: string) => `${mint.slice(0, 6)}...${mint.slice(-4)}`;

  return (
    <div className={styles.container}>
      {/* 1-Click Direct Wallet Token Cards (No typing or symbol input required) */}
      {showQuickWalletCards && tokens.length > 0 && (
        <div className={styles.walletCardsStrip}>
          {tokens.map((token) => {
            const isSelected = token.mint === selectedTokenMint;
            const displayLabel =
              token.name && token.name !== "Custom Token"
                ? token.name
                : `Wallet Token (${formatMintShort(token.mint)})`;
            return (
              <button
                key={token.mint}
                type="button"
                disabled={disabled || isLoading}
                onClick={() => handleSelect(token.mint)}
                className={`${styles.walletTokenChip} ${
                  isSelected ? styles.walletTokenChipActive : ""
                }`}
              >
                <Image
                  src={token.logoURI || "/favicon.ico"}
                  alt={displayLabel}
                  width={26}
                  height={26}
                  unoptimized
                  className={styles.tokenIcon}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/favicon.ico";
                  }}
                />
                <div className={styles.chipMeta}>
                  <span className={styles.chipTitle}>
                    {displayLabel}
                    {token.isLpToken && <span className={styles.lpTag}>LP</span>}
                  </span>
                  <span className={styles.chipSub}>
                    Balance:{" "}
                    {parseFloat(token.amount).toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })}{" "}
                    · {formatMintShort(token.mint)}
                  </span>
                </div>
                {isSelected && <span className={styles.selectedCheck}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Direct Wallet Dropdown Selector (Zero text/symbol inputs) */}
      <div className={styles.wrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.selectorButton}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span>Loading tokens directly from your connected wallet...</span>
          ) : selectedToken ? (
            <div className={styles.tokenDisplay}>
              <Image
                src={selectedToken.logoURI || "/favicon.ico"}
                alt={selectedToken.name || "Wallet Token"}
                width={26}
                height={26}
                unoptimized
                className={styles.tokenIcon}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/favicon.ico";
                }}
              />
              <div className={styles.selectedTextGroup}>
                <span className={styles.selectedPrimary}>
                  {selectedToken.name && selectedToken.name !== "Custom Token"
                    ? selectedToken.name
                    : `Wallet Asset (${formatMintShort(selectedToken.mint)})`}
                </span>
                <span className={styles.selectedSecondary}>
                  Mint: {formatMintShort(selectedToken.mint)} · Balance:{" "}
                  {parseFloat(selectedToken.amount).toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            </div>
          ) : tokens.length === 0 ? (
            <span>No tokens detected in your connected wallet on this network</span>
          ) : (
            <span>Click to choose a token from your connected wallet</span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▼</span>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span>Connected Wallet Assets ({tokens.length}) — Click to Select</span>
            </div>
            <ul className={styles.tokenList}>
              {tokens.length > 0 ? (
                tokens.map((token) => (
                  <li
                    key={token.mint}
                    className={`${styles.tokenItem} ${
                      token.mint === selectedTokenMint ? styles.tokenItemSelected : ""
                    }`}
                    onClick={() => handleSelect(token.mint)}
                  >
                    <Image
                      src={token.logoURI || "/favicon.ico"}
                      alt={token.name || "Wallet Token"}
                      width={32}
                      height={32}
                      unoptimized
                      className={styles.tokenIcon}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/favicon.ico";
                      }}
                    />
                    <div className={styles.tokenItemInfo}>
                      <span className={styles.tokenSymbol}>
                        {token.name && token.name !== "Custom Token"
                          ? token.name
                          : `Token ${formatMintShort(token.mint)}`}
                        {token.isLpToken && <span className={styles.lpTag}>LP Pool Token</span>}
                      </span>
                      <span className={styles.tokenName}>Mint: {token.mint}</span>
                    </div>
                    <span className={styles.tokenBalance}>
                      {parseFloat(token.amount).toLocaleString("en-US", {
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  </li>
                ))
              ) : (
                <li className={styles.noResult}>
                  No tokens found in your connected wallet on this network.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
