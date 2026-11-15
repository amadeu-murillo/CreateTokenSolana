"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
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

function UrlMintAutoSelector({
  tokens,
  selectedTokenMint,
  onSelectToken,
  isLoading,
}: {
  tokens: SelectableWalletToken[];
  selectedTokenMint: string;
  onSelectToken: (mint: string) => void;
  isLoading: boolean;
}) {
  const searchParams = useSearchParams();
  const mintFromUrl = searchParams.get("mint");

  useEffect(() => {
    if (!mintFromUrl || isLoading || tokens.length === 0) return;
    const match = tokens.find((t) => t.mint === mintFromUrl);
    if (match && selectedTokenMint !== match.mint) {
      onSelectToken(match.mint);
    }
  }, [mintFromUrl, isLoading, tokens, selectedTokenMint, onSelectToken]);

  return null;
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
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading || tokens.length === 0 || selectedTokenMint) return;
    if (typeof window !== "undefined") {
      const urlMint = new URLSearchParams(window.location.search).get("mint");
      if (urlMint && tokens.some((tk) => tk.mint === urlMint)) {
        onSelectToken(urlMint);
        return;
      }
    }
    if (autoSelectFirst) {
      onSelectToken(tokens[0].mint);
    }
  }, [autoSelectFirst, selectedTokenMint, tokens, isLoading, onSelectToken]);

  const selectedToken = tokens.find((tk) => tk.mint === selectedTokenMint) || null;

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
      <Suspense fallback={null}>
        <UrlMintAutoSelector
          tokens={tokens}
          selectedTokenMint={selectedTokenMint}
          onSelectToken={onSelectToken}
          isLoading={isLoading}
        />
      </Suspense>

      {showQuickWalletCards && isLoading && (
        <div
          className={styles.skeletonStrip}
          aria-busy="true"
          aria-label={t.tokenSelector.loadingAria}
        >
          {[1, 2, 3].map((item) => (
            <div key={item} className={styles.skeletonChip}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonTextGroup}>
                <div className={styles.skeletonLinePrimary} />
                <div className={styles.skeletonLineSecondary} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showQuickWalletCards && !isLoading && tokens.length > 0 && (
        <div className={styles.walletCardsStrip}>
          {tokens.map((token) => {
            const isSelected = token.mint === selectedTokenMint;
            const displayLabel =
              token.name && token.name !== "Custom Token"
                ? token.name
                : `Token (${formatMintShort(token.mint)})`;
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
                    {t.tokenSelector.balancePrefix}{" "}
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

      <div className={styles.wrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.selectorButton}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <div className={styles.skeletonSelectorBar}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonTextGroup}>
                <div className={styles.skeletonLinePrimary} />
                <div className={styles.skeletonLineSecondary} />
              </div>
            </div>
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
                    : `Asset (${formatMintShort(selectedToken.mint)})`}
                </span>
                <span className={styles.selectedSecondary}>
                  Mint: {formatMintShort(selectedToken.mint)} · {t.tokenSelector.balancePrefix}{" "}
                  {parseFloat(selectedToken.amount).toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            </div>
          ) : tokens.length === 0 ? (
            <span>{t.tokenSelector.noTokensDetected}</span>
          ) : (
            <span>{t.tokenSelector.clickToChoose}</span>
          )}
          <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ""}`}>▼</span>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span>
                {t.tokenSelector.dropdownHeader} ({tokens.length})
              </span>
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
                        {token.isLpToken && (
                          <span className={styles.lpTag}>{t.tokenSelector.lpPoolTokenTag}</span>
                        )}
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
                <li className={styles.noResult}>{t.tokenSelector.noTokensDetected}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
