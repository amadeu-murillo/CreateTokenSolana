"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/TokenSelector";
import CostSummary from "@/components/CostSummary";
import Notification from "@/components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
import { useRemoveLiquidity } from "@/hooks/useRemoveLiquidity";
import {
  MODULAR_FEE_JITO_BUNDLE_SOL,
  SERVICE_FEE_CREATE_LP_DEVNET_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
  SERVICE_FEE_REMOVE_LP_SOL,
} from "@/lib/constants";
import { QuoteAsset, SupportedDex } from "@/types/api";
import styles from "./AddLiquidity.module.css";

const ALLOCATION_PRESETS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
  { label: "MAX", ratio: 1 },
];

interface SnapshotTokenDossier {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string;
  decimals: number;
  standard: "SPL" | "Token-2022";
  programId: string;
  totalSupply: number;
  baseDeposited: number;
  quoteDeposited: number;
  quoteSymbol: QuoteAsset;
  remainingBalance: number;
  supplyPctInPool: number;
  impliedMarketCap: number;
  feeTierLabel: string;
  mintAuthorityActive: boolean;
  freezeAuthorityActive: boolean;
  launchScheduleLabel: string;
}

interface StoredLpPoolRecord {
  poolId?: string;
  poolAddress?: string;
  lpMintAddress?: string;
  baseVaultAddress?: string;
  quoteVaultAddress?: string;
  baseMint?: string;
  quoteToken?: QuoteAsset;
  quoteAmount?: number | string;
  network?: string;
}

function AddLiquidityPageInner() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";
  const { tokens: userTokens, isLoading: isLoadingTokens, refreshTokens } = useUserTokens();

  const {
    createLiquidityPool,
    isLoading: isCreatingPool,
    statusStep,
    progressStep,
    error: poolError,
    poolResult,
    reset: resetPoolState,
  } = useCreateLiquidityPool();

  const {
    removeLiquidity,
    isLoading: isRemovingLiquidity,
    statusStep: removeStatusStep,
    progressStep: removeProgressStep,
    error: removeError,
    removeResult,
    reset: resetRemoveState,
  } = useRemoveLiquidity();

  const [activeMode, setActiveMode] = useState<"add" | "withdraw">("add");
  const [dex, setDex] = useState<SupportedDex>("raydium-cpmm");
  const [quoteToken, setQuoteToken] = useState<QuoteAsset>("SOL");
  const [selectedTokenMint, setSelectedTokenMint] = useState<string>("");
  const [baseAmount, setBaseAmount] = useState<string>("");
  const [quoteAmount, setQuoteAmount] = useState<string>("0.2");
  const [feeTierBps, setFeeTierBps] = useState<number>(25);
  const [launchMode, setLaunchMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [revokeFreezeIfActive, setRevokeFreezeIfActive] = useState<boolean>(true);
  const [hasActiveFreezeAuth, setHasActiveFreezeAuth] = useState<boolean>(false);
  const [hasActiveMintAuth, setHasActiveMintAuth] = useState<boolean>(false);
  const [mintDecimals, setMintDecimals] = useState<number>(9);
  const [totalTokenSupply, setTotalTokenSupply] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenDossierSnapshot, setTokenDossierSnapshot] = useState<SnapshotTokenDossier | null>(
    null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [detectedQuoteAsset, setDetectedQuoteAsset] = useState<QuoteAsset>("SOL");

  // Phase 3: Jito Anti-Sniper Bundle toggle on Pool Launch
  const [jitoPoolBundleEnabled, setJitoPoolBundleEnabled] = useState<boolean>(false);
  const [jitoFirstBuySol, setJitoFirstBuySol] = useState<string>("0.1");
  const [jitoTipSol, setJitoTipSol] = useState<string>("0.002");

  const [withdrawPercentage, setWithdrawPercentage] = useState<number>(100);
  const [customPoolId, setCustomPoolId] = useState<string>("");
  const [detectedPoolId, setDetectedPoolId] = useState<string>("");
  const [detectedLpMint, setDetectedLpMint] = useState<string>("");
  const [detectedQuoteVault, setDetectedQuoteVault] = useState<string>("");
  const [detectedVaultSol, setDetectedVaultSol] = useState<number | null>(null);
  const [detectedLpBalance, setDetectedLpBalance] = useState<number | null>(null);
  const [isCheckingVault, setIsCheckingVault] = useState<boolean>(false);

  const baseLpFeeSol =
    cluster === "devnet" ? SERVICE_FEE_CREATE_LP_DEVNET_SOL : SERVICE_FEE_CREATE_LP_SOL;
  const activeLpFeeSol = Number(
    (baseLpFeeSol + (jitoPoolBundleEnabled ? MODULAR_FEE_JITO_BUNDLE_SOL : 0)).toFixed(2)
  );

  const feeTiers = useMemo(
    () => [
      { bps: 25, label: "0.25%", badge: t.liquidityPage.tierRecommended },
      { bps: 100, label: "1.00%", badge: t.liquidityPage.tierStandard },
      { bps: 200, label: "2.00%", badge: t.liquidityPage.tierHighVol },
      { bps: 400, label: "4.00%", badge: "400 bps" },
    ],
    [t]
  );

  const withdrawShareOptions = useMemo(
    () => [
      { pct: 25, label: "25%", desc: t.liquidityPage.sharePartial },
      { pct: 50, label: "50%", desc: t.liquidityPage.shareHalf },
      { pct: 75, label: "75%", desc: t.liquidityPage.shareMajor },
      { pct: 100, label: "100% MAX", desc: t.liquidityPage.shareFull },
    ],
    [t]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mintFromQuery = params.get("mint");
      const poolIdFromQuery = params.get("poolId");
      const modeFromQuery = params.get("mode");
      if (mintFromQuery && !selectedTokenMint) {
        setSelectedTokenMint(mintFromQuery);
      }
      if (poolIdFromQuery && !customPoolId) {
        setCustomPoolId(poolIdFromQuery);
      }
      if (modeFromQuery === "withdraw") {
        setActiveMode("withdraw");
      }
    }
  }, [selectedTokenMint, customPoolId]);

  const selectedToken = useMemo(
    () => userTokens.find((tk) => tk.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

  const resolvedWithdrawBaseMint = useMemo(() => {
    if (!selectedToken) return selectedTokenMint;
    if (selectedToken.isLpToken && selectedToken.pairedBaseMint) {
      return selectedToken.pairedBaseMint;
    }
    return selectedToken.mint;
  }, [selectedToken, selectedTokenMint]);

  const resolvedWithdrawLpMint = useMemo(() => {
    if (detectedLpMint) return detectedLpMint;
    if (!selectedToken) return undefined;
    if (selectedToken.isLpToken) {
      return selectedToken.mint;
    }
    if (selectedToken.pairedLpMint) {
      return selectedToken.pairedLpMint;
    }
    return undefined;
  }, [selectedToken, detectedLpMint]);

  const resolvedWithdrawPoolId = useMemo(() => {
    const trimmedCustom = customPoolId.trim();
    if (trimmedCustom) return trimmedCustom;
    if (detectedPoolId) return detectedPoolId;
    return undefined;
  }, [customPoolId, detectedPoolId]);

  useEffect(() => {
    if (!publicKey || !connection) {
      setSolBalance(null);
      return;
    }
    let mounted = true;
    connection
      .getBalance(publicKey, "confirmed")
      .then((lamports) => {
        if (mounted) setSolBalance(lamports / 1e9);
      })
      .catch(() => {
        if (mounted) setSolBalance(null);
      });
    return () => {
      mounted = false;
    };
  }, [publicKey, connection, cluster, poolResult, removeResult]);

  // Inspect cached Raydium CPMM pool record + live on-chain vault & LP balances
  useEffect(() => {
    if (!publicKey || !resolvedWithdrawBaseMint || !connection) {
      setDetectedPoolId("");
      setDetectedLpMint("");
      setDetectedQuoteVault("");
      setDetectedVaultSol(null);
      setDetectedLpBalance(null);
      return;
    }

    let mounted = true;
    (async () => {
      setIsCheckingVault(true);
      try {
        let poolRecord: StoredLpPoolRecord | undefined;
        try {
          const rawMap = localStorage.getItem("createdLpPoolsMap");
          if (rawMap) {
            const parsedMap: Record<string, StoredLpPoolRecord> = JSON.parse(rawMap);
            poolRecord =
              parsedMap[resolvedWithdrawBaseMint] ||
              (selectedTokenMint ? parsedMap[selectedTokenMint] : undefined);
          }
        } catch {
          poolRecord = undefined;
        }

        const candidatePoolId = poolRecord?.poolId || poolRecord?.poolAddress || "";
        const candidateLpMint =
          poolRecord?.lpMintAddress ||
          (selectedToken?.isLpToken ? selectedToken.mint : selectedToken?.pairedLpMint) ||
          "";
        const candidateQuoteVault = poolRecord?.quoteVaultAddress || "";

        if (mounted) {
          setDetectedPoolId(candidatePoolId);
          setDetectedLpMint(candidateLpMint);
          setDetectedQuoteVault(candidateQuoteVault);
          setDetectedQuoteAsset(poolRecord?.quoteToken === "USDC" ? "USDC" : "SOL");
        }

        if (candidateQuoteVault) {
          try {
            const vaultBal = await connection.getTokenAccountBalance(
              new PublicKey(candidateQuoteVault),
              "confirmed"
            );
            if (mounted) {
              setDetectedVaultSol(Number(vaultBal.value.uiAmount || 0));
            }
          } catch {
            if (mounted) setDetectedVaultSol(null);
          }
        } else if (mounted) {
          setDetectedVaultSol(null);
        }

        if (candidateLpMint) {
          try {
            const userLpAta = await getAssociatedTokenAddress(
              new PublicKey(candidateLpMint),
              publicKey,
              false,
              TOKEN_PROGRAM_ID
            );
            const lpBal = await connection.getTokenAccountBalance(userLpAta, "confirmed");
            if (mounted) {
              setDetectedLpBalance(Number(lpBal.value.uiAmount || 0));
            }
          } catch {
            if (mounted) setDetectedLpBalance(null);
          }
        } else if (mounted) {
          setDetectedLpBalance(null);
        }
      } finally {
        if (mounted) setIsCheckingVault(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    publicKey,
    resolvedWithdrawBaseMint,
    selectedTokenMint,
    selectedToken,
    connection,
    poolResult,
    removeResult,
  ]);

  useEffect(() => {
    if (!selectedToken || !connection) {
      setHasActiveFreezeAuth(false);
      setHasActiveMintAuth(false);
      setTotalTokenSupply(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const mintPubkey = new PublicKey(selectedToken.mint);
        const programPubkey =
          selectedToken.programId === TOKEN_2022_PROGRAM_ID.toBase58()
            ? TOKEN_2022_PROGRAM_ID
            : TOKEN_PROGRAM_ID;
        const mintInfo = await getMint(connection, mintPubkey, "confirmed", programPubkey);
        if (mounted) {
          setHasActiveFreezeAuth(Boolean(mintInfo.freezeAuthority));
          setHasActiveMintAuth(Boolean(mintInfo.mintAuthority));
          setMintDecimals(mintInfo.decimals);
          setTotalTokenSupply(Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals));
        }
      } catch (err) {
        console.warn("Could not inspect mint details:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedToken?.mint, selectedToken?.programId, connection]);

  const numericBase = parseFloat(baseAmount) || 0;
  const numericQuote = parseFloat(quoteAmount) || 0;

  const initialPrice = useMemo(() => {
    if (numericBase <= 0 || numericQuote <= 0) return 0;
    return numericQuote / numericBase;
  }, [numericBase, numericQuote]);

  const estimatedMarketCap = useMemo(() => {
    if (initialPrice <= 0) return 0;
    const supply = totalTokenSupply || parseFloat(selectedToken?.amount || "0") || 0;
    return initialPrice * supply;
  }, [initialPrice, totalTokenSupply, selectedToken]);

  const supplyPercentageInPool = useMemo(() => {
    const supply = totalTokenSupply || parseFloat(selectedToken?.amount || "0") || 0;
    if (supply <= 0 || numericBase <= 0) return 0;
    return Math.min(100, (numericBase / supply) * 100);
  }, [numericBase, totalTokenSupply, selectedToken]);

  const handlePercentagePreset = (ratio: number) => {
    if (!selectedToken) return;
    const balance = parseFloat(selectedToken.amount) || 0;
    const computed = balance * ratio;
    setBaseAmount(computed > 0 ? String(Number(computed.toFixed(4))) : "");
  };

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken || numericBase <= 0 || numericQuote <= 0) return;

    let startTimeUnix: number | null = null;
    if (launchMode === "scheduled" && scheduledDateTime) {
      const parsedMs = Date.parse(scheduledDateTime);
      if (!isNaN(parsedMs) && parsedMs > Date.now()) {
        startTimeUnix = Math.floor(parsedMs / 1000);
      }
    }

    const totalSup = totalTokenSupply || parseFloat(selectedToken.amount) || numericBase;
    const walletBalBefore = parseFloat(selectedToken.amount) || 0;
    const tierObj = feeTiers.find((tr) => tr.bps === feeTierBps) || feeTiers[0];

    const snapshot: SnapshotTokenDossier = {
      mint: selectedToken.mint,
      name: selectedToken.name || "Wallet Token",
      symbol: selectedToken.symbol || selectedToken.mint.slice(0, 6),
      logoURI: selectedToken.logoURI || "/favicon.ico",
      decimals: mintDecimals,
      standard:
        selectedToken.programId === TOKEN_2022_PROGRAM_ID.toBase58() ? "Token-2022" : "SPL",
      programId: selectedToken.programId,
      totalSupply: totalSup,
      baseDeposited: numericBase,
      quoteDeposited: numericQuote,
      quoteSymbol: quoteToken,
      remainingBalance: Math.max(0, walletBalBefore - numericBase),
      supplyPctInPool: supplyPercentageInPool,
      impliedMarketCap: estimatedMarketCap,
      feeTierLabel: `${tierObj.label} (${tierObj.badge})`,
      mintAuthorityActive: hasActiveMintAuth,
      freezeAuthorityActive: hasActiveFreezeAuth && !revokeFreezeIfActive,
      launchScheduleLabel:
        launchMode === "scheduled" && scheduledDateTime
          ? new Date(scheduledDateTime).toLocaleString()
          : t.liquidityPage.immediateBtn,
    };

    const res = await createLiquidityPool({
      dex,
      baseMint: selectedToken.mint,
      quoteToken,
      baseAmount: numericBase,
      quoteAmount: numericQuote,
      feeTierBps,
      startTime: startTimeUnix,
      revokeFreezeIfActive,
      programId: selectedToken.programId,
      network: cluster,
    });

    if (res) {
      setTokenDossierSnapshot(snapshot);
      refreshTokens();
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBaseMint = resolvedWithdrawBaseMint || resolvedWithdrawPoolId;
    if (!targetBaseMint) return;

    const res = await removeLiquidity({
      baseMint: targetBaseMint,
      poolId: resolvedWithdrawPoolId,
      lpMint: resolvedWithdrawLpMint,
      withdrawPercentage,
      programId: selectedToken?.programId,
      network: cluster,
    });

    if (res) {
      refreshTokens();
    }
  };

  const handleSwitchToWithdrawFromDossier = () => {
    if (poolResult?.poolAddress) {
      setCustomPoolId(poolResult.poolAddress);
    }
    resetPoolState();
    setActiveMode("withdraw");
  };

  const handleReset = () => {
    resetPoolState();
    resetRemoveState();
    setTokenDossierSnapshot(null);
    setBaseAmount("");
    setQuoteAmount("0.2");
  };

  const isTokenReady = Boolean(selectedToken);
  const areAmountsReady = numericBase > 0 && numericQuote > 0;
  const isFreezeReady = !hasActiveFreezeAuth || revokeFreezeIfActive;

  const simulatedGrossSol =
    detectedVaultSol && detectedVaultSol > 0
      ? Number(((detectedVaultSol * withdrawPercentage) / 100).toFixed(6))
      : Number(((numericQuote * withdrawPercentage) / 100).toFixed(6));
  const simulatedRentReclaim = withdrawPercentage === 100 ? 0.002039 : 0;
  const simulatedNetSolOut = Math.max(
    0,
    simulatedGrossSol + simulatedRentReclaim - SERVICE_FEE_REMOVE_LP_SOL
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.topNetworkRow}>
          <div className={styles.networkPillGroup}>
            <span>{t.common.activeNetwork}</span>
            <button
              type="button"
              onClick={() => setCluster("mainnet-beta")}
              className={cluster === "mainnet-beta" ? styles.netBtnMainnet : styles.netBtnInactive}
            >
              ● Mainnet-Beta
            </button>
            <button
              type="button"
              onClick={() => setCluster("devnet")}
              className={cluster === "devnet" ? styles.netBtnDevnet : styles.netBtnInactive}
            >
              ● Devnet
            </button>
          </div>
          <span className={styles.feeBadgeTop}>
            {activeMode === "add" ? (
              <>
                {t.liquidityPage.addFeeLabel} <strong>{activeLpFeeSol.toFixed(2)} SOL</strong>
              </>
            ) : (
              <>
                {t.liquidityPage.withdrawFeeLabel}{" "}
                <strong>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</strong>
              </>
            )}
          </span>
        </div>

        <h1 className={styles.pageTitle}>
          {activeMode === "add" ? t.liquidityPage.titleAdd : t.liquidityPage.titleWithdraw}
        </h1>
        <p className={styles.pageDescription}>
          {activeMode === "add" ? t.liquidityPage.descAdd : t.liquidityPage.descWithdraw}
        </p>

        <div className={styles.modeTabsBar}>
          <button
            type="button"
            onClick={() => {
              setActiveMode("add");
              resetRemoveState();
            }}
            className={activeMode === "add" ? styles.modeTabBtnActive : styles.modeTabBtn}
          >
            <span>{t.liquidityPage.tabAdd}</span>
            <span className={styles.modeFeePill}>{activeLpFeeSol.toFixed(2)} SOL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode("withdraw");
              resetPoolState();
            }}
            className={
              activeMode === "withdraw" ? styles.modeTabBtnWithdrawActive : styles.modeTabBtn
            }
          >
            <span>{t.liquidityPage.tabWithdraw}</span>
            <span className={styles.modeFeePill}>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</span>
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <main className={styles.mainContent}>
          {activeMode === "withdraw" ? (
            removeResult ? (
              <div className={styles.dossierWrapper}>
                <Card className={styles.receiptCard}>
                  <CardHeader>
                    <div className={styles.dossierHeroHeader}>
                      <div>
                        <span className={styles.livePoolBadge}>
                          ✓ RAYDIUM CPMM {removeResult.lpPairLabel} LIQUIDITY WITHDRAWN ({cluster.toUpperCase()})
                        </span>
                        <CardTitle className={styles.receiptTitle}>
                          +{removeResult.withdrawnQuote.toFixed(removeResult.quoteToken === "USDC" ? 2 : 6)} {removeResult.quoteToken}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className={styles.receiptContent}>
                    <div className={styles.dossierSection}>
                      <div className={styles.dossierMetricsGrid}>
                        <div className={styles.dossierMetricBox}>
                          <span>{removeResult.quoteToken === "USDC" ? "USDC Retornado" : t.liquidityPage.estimatedSolUnwrapped}</span>
                          <strong className={styles.textEmerald}>
                            {removeResult.estimatedQuoteReturned} {removeResult.quoteToken}
                          </strong>
                        </div>
                        <div className={styles.dossierMetricBox}>
                          <span>{isPt ? "Tokens Base Retornados" : "Base Tokens Returned"}</span>
                          <strong>{removeResult.estimatedBaseReturned}</strong>
                        </div>
                        <div className={styles.dossierMetricBox}>
                          <span>{t.liquidityPage.selectedShareLabel}</span>
                          <strong>{removeResult.withdrawPercentage}%</strong>
                        </div>
                        <div className={styles.dossierMetricBox}>
                          <span>{t.liquidityPage.devFeeLabel}</span>
                          <strong className={styles.textPurple}>
                            {removeResult.serviceFeeSol.toFixed(2)} SOL
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.dossierSection}>
                      <div className={styles.addressDirectory}>
                        {[
                          {
                            key: "poolId",
                            label: "Raydium CPMM Pool ID",
                            value: removeResult.poolId,
                            explorerType: "account" as const,
                          },
                          {
                            key: "lpMint",
                            label: "LP Token Mint",
                            value: removeResult.lpMint,
                            explorerType: "token" as const,
                          },
                          {
                            key: "quoteVault",
                            label: `${removeResult.lpPairLabel} Quote Vault (${removeResult.quoteToken})`,
                            value: removeResult.quoteVaultAddress,
                            explorerType: "account" as const,
                          },
                          {
                            key: "withdrawTx",
                            label: "TX Signature",
                            value: removeResult.signature,
                            explorerType: "tx" as const,
                          },
                        ]
                          .filter((item) => Boolean(item.value))
                          .map((item) => (
                            <div key={item.key} className={styles.addressRow}>
                              <div className={styles.addressHeader}>
                                <span>{item.label}</span>
                                <div className={styles.addressActions}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.value, item.key)}
                                    className={styles.copyBtnSmall}
                                  >
                                    {copiedKey === item.key ? t.common.copied : t.common.copy}
                                  </button>
                                  <a
                                    href={getExplorerUrl(item.explorerType, item.value)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.solscanBtnSmall}
                                  >
                                    {t.common.viewOnSolscan}
                                  </a>
                                </div>
                              </div>
                              <code>{item.value}</code>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className={styles.dossierFooterActions}>
                    <Button onClick={resetRemoveState} className="secondary">
                      {t.liquidityPage.tabWithdraw}
                    </Button>
                    <Button
                      onClick={() => {
                        resetRemoveState();
                        setActiveMode("add");
                      }}
                    >
                      {t.liquidityPage.tabAdd}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t.liquidityPage.withdrawCardTitle} ({cluster})
                  </CardTitle>
                  <CardDescription>
                    {t.liquidityPage.withdrawCardDesc} (
                    <strong>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</strong>)
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleWithdrawSubmit}>
                  <CardContent className={styles.formContent}>
                    {removeError && (
                      <Notification
                        type="error"
                        message={removeError}
                        onClose={resetRemoveState}
                      />
                    )}

                    <TransactionStatusStepper
                      isActive={isRemovingLiquidity}
                      currentStepIndex={removeProgressStep}
                      statusMessage={removeStatusStep}
                      operationTitle={`${t.liquidityPage.withdrawingStatus} (${withdrawPercentage}% · ${cluster})`}
                    />

                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label>{t.liquidityPage.step2SelectToken}</Label>
                        <div className={styles.presetButtons}>
                          {solBalance !== null && (
                            <span className={styles.balanceTag}>
                              SOL: {solBalance.toFixed(4)} SOL
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={refreshTokens}
                            disabled={isLoadingTokens || isRemovingLiquidity}
                            className={styles.presetBtn}
                          >
                            {t.common.refreshWallet}
                          </button>
                        </div>
                      </div>
                      <TokenSelector
                        tokens={userTokens}
                        selectedTokenMint={selectedTokenMint}
                        onSelectToken={(mint) => setSelectedTokenMint(mint)}
                        isLoading={isLoadingTokens}
                        disabled={isRemovingLiquidity}
                        autoSelectFirst={true}
                        showQuickWalletCards={true}
                      />
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="customPoolId">
                        {isPt
                          ? "Raydium CPMM Pool ID (Opcional — descoberto automaticamente via Token/LP Mint)"
                          : "Raydium CPMM Pool ID (Optional — auto-discovered via Token/LP Mint)"}
                      </Label>
                      <Input
                        id="customPoolId"
                        type="text"
                        placeholder={
                          detectedPoolId ||
                          (isPt
                            ? "Ex: Endereço do Pool CPMM na Raydium..."
                            : "e.g. Raydium CPMM Pool Address...")
                        }
                        value={customPoolId}
                        onChange={(e) => setCustomPoolId(e.target.value)}
                        disabled={isRemovingLiquidity}
                      />
                    </div>

                    {resolvedWithdrawBaseMint && (
                      <div className={styles.vaultStatusCard}>
                        <div className={styles.vaultStatusHeader}>
                          <strong>
                            {t.liquidityPage.vaultAutoDetected} (
                            {resolvedWithdrawBaseMint.slice(0, 6)}...
                            {resolvedWithdrawBaseMint.slice(-4)})
                          </strong>
                          <span className={styles.balanceTag}>
                            {isCheckingVault
                              ? t.liquidityPage.inspectingVault
                              : detectedVaultSol !== null && detectedVaultSol > 0
                                ? `${detectedVaultSol.toFixed(4)} ${detectedQuoteAsset} in Pool Vault (LP-${detectedQuoteAsset})`
                                : detectedLpBalance !== null && detectedLpBalance > 0
                                  ? `${detectedLpBalance.toFixed(4)} LP-${detectedQuoteAsset}`
                                  : t.liquidityPage.readyToUnwrap}
                          </span>
                        </div>
                        {resolvedWithdrawPoolId && (
                          <span className={styles.vaultAddressMono}>
                            Pool ID: {resolvedWithdrawPoolId}
                          </span>
                        )}
                        {resolvedWithdrawLpMint && (
                          <span className={styles.vaultAddressMono}>
                            LP Mint: {resolvedWithdrawLpMint}
                          </span>
                        )}
                        {detectedQuoteVault && (
                          <span className={styles.vaultAddressMono}>
                            Quote Vault: {detectedQuoteVault}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={styles.field}>
                      <Label>{t.liquidityPage.selectWithdrawalShareLabel}</Label>
                      <div className={styles.withdrawShareGrid}>
                        {withdrawShareOptions.map((opt) => (
                          <button
                            key={opt.pct}
                            type="button"
                            onClick={() => setWithdrawPercentage(opt.pct)}
                            disabled={isRemovingLiquidity}
                            className={
                              withdrawPercentage === opt.pct
                                ? styles.withdrawShareBtnActive
                                : styles.withdrawShareBtn
                            }
                          >
                            <strong>{opt.label}</strong>
                            <span>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.simulatorBox}>
                      <h4 className={styles.simulatorTitle}>
                        {t.liquidityPage.withdrawSimulatorTitle}
                      </h4>
                      <div className={styles.simulatorMetrics}>
                        <div className={styles.metricCard}>
                          <span>{t.liquidityPage.selectedShareLabel}</span>
                          <strong>{withdrawPercentage}%</strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>{detectedQuoteAsset === "USDC" ? "USDC Estimado (LP-USDC)" : t.liquidityPage.estimatedSolUnwrapped}</span>
                          <strong className={styles.textEmerald}>
                            ~{simulatedGrossSol.toFixed(4)} {detectedQuoteAsset}
                          </strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>{t.liquidityPage.devFeeLabel}</span>
                          <strong className={styles.textPurple}>
                            {SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL
                          </strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>{t.liquidityPage.estNetSolToWallet}</span>
                          <strong className={styles.textEmerald}>
                            ~{simulatedNetSolOut.toFixed(4)} SOL
                          </strong>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className={styles.formFooter}>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        isRemovingLiquidity ||
                        (!resolvedWithdrawBaseMint && !resolvedWithdrawPoolId) ||
                        !publicKey
                      }
                    >
                      {isRemovingLiquidity
                        ? removeStatusStep || t.liquidityPage.withdrawingStatus
                        : `${t.liquidityPage.submitWithdrawBtn} (${withdrawPercentage}% · ${SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL)`}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )
          ) : poolResult ? (
            <div className={styles.dossierWrapper}>
              <Card className={styles.receiptCard}>
                <CardHeader>
                  <div className={styles.dossierHeroHeader}>
                    <div className={styles.dossierTokenIdentity}>
                      <img
                        src={tokenDossierSnapshot?.logoURI || "/favicon.ico"}
                        alt={tokenDossierSnapshot?.name || "Token"}
                        className={styles.dossierTokenLogo}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/favicon.ico";
                        }}
                      />
                      <div>
                        <span className={styles.livePoolBadge}>
                          ✓ RAYDIUM CPMM POOL LIVE ({cluster.toUpperCase()})
                        </span>
                        <CardTitle className={styles.receiptTitle}>
                          {tokenDossierSnapshot?.name || "Token"} (
                          {tokenDossierSnapshot?.symbol || "TOKEN"}) /{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className={styles.receiptContent}>
                  <div className={styles.dossierSection}>
                    <div className={styles.dossierMetricsGrid}>
                      <div className={styles.dossierMetricBox}>
                        <span>{t.liquidityPage.initialPriceLabel}</span>
                        <strong className={styles.textEmerald}>
                          {poolResult.initialPrice.toFixed(9)}{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>{t.liquidityPage.impliedMcapLabel}</span>
                        <strong>
                          {(
                            tokenDossierSnapshot?.impliedMarketCap ?? estimatedMarketCap
                          ).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>LP Minted</span>
                        <strong className={styles.textPurple}>
                          {poolResult.lpTokensMinted || "100%"} LP
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dossierSection}>
                    <div className={styles.addressDirectory}>
                      {[
                        {
                          key: "tokenMint",
                          label: "Token Mint",
                          value: tokenDossierSnapshot?.mint || selectedTokenMint,
                          explorerType: "token" as const,
                        },
                        {
                          key: "poolPda",
                          label: "Raydium Pool ID",
                          value: poolResult.poolAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "lpMint",
                          label: "LP Mint",
                          value: poolResult.lpMintAddress,
                          explorerType: "token" as const,
                        },
                        {
                          key: "baseVault",
                          label: "Base Vault",
                          value: poolResult.baseVaultAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "quoteVault",
                          label: "Quote Vault",
                          value: poolResult.quoteVaultAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "txSig",
                          label: "TX Signature",
                          value: poolResult.signature,
                          explorerType: "tx" as const,
                        },
                      ].map((item) => (
                        <div key={item.key} className={styles.addressRow}>
                          <div className={styles.addressHeader}>
                            <span>{item.label}</span>
                            <div className={styles.addressActions}>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.value, item.key)}
                                className={styles.copyBtnSmall}
                              >
                                {copiedKey === item.key ? t.common.copied : t.common.copy}
                              </button>
                              <a
                                href={getExplorerUrl(item.explorerType, item.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.solscanBtnSmall}
                              >
                                {t.common.viewOnSolscan}
                              </a>
                            </div>
                          </div>
                          <code>{item.value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className={styles.dossierFooterActions}>
                  <button
                    type="button"
                    onClick={handleSwitchToWithdrawFromDossier}
                    className={styles.actionLinkBtn}
                  >
                    {t.liquidityPage.tabWithdraw}
                  </button>
                  <Link href="/burn" className={styles.actionLinkBtn}>
                    🔥 {t.nav.burn}
                  </Link>
                  <Link href="/airdrop" className={styles.actionLinkBtn}>
                    📦 {t.nav.airdrop}
                  </Link>
                  <Button onClick={handleReset} className="secondary">
                    {t.liquidityPage.tabAdd}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t.liquidityPage.configurePairTitle} ({cluster})
                </CardTitle>
                <CardDescription>{t.liquidityPage.configurePairDesc}</CardDescription>

                <div className={styles.readinessBar}>
                  <span className={styles.readyStepDone}>{t.liquidityPage.readyStep1}</span>
                  <span className={isTokenReady ? styles.readyStepDone : styles.readyStepPending}>
                    {isTokenReady
                      ? t.liquidityPage.readyStep2Done
                      : t.liquidityPage.readyStep2Pending}
                  </span>
                  <span className={areAmountsReady ? styles.readyStepDone : styles.readyStepPending}>
                    {areAmountsReady
                      ? t.liquidityPage.readyStep3Done
                      : t.liquidityPage.readyStep3Pending}
                  </span>
                  <span className={isFreezeReady ? styles.readyStepDone : styles.readyStepWarn}>
                    {isFreezeReady
                      ? t.liquidityPage.readyStep4Done
                      : t.liquidityPage.readyStep4Warn}
                  </span>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className={styles.formContent}>
                  {poolError && (
                    <Notification type="error" message={poolError} onClose={resetPoolState} />
                  )}

                  <TransactionStatusStepper
                    isActive={isCreatingPool}
                    currentStepIndex={progressStep}
                    statusMessage={statusStep}
                    operationTitle={`${t.liquidityPage.initializingPoolStatus} (${cluster})`}
                  />

                  <div className={styles.field}>
                    <Label>{t.liquidityPage.step1AmmLabel}</Label>
                    <div className={styles.dexSelector}>
                      <button
                        type="button"
                        onClick={() => setDex("raydium-cpmm")}
                        className={`${styles.dexOption} ${styles.dexOptionActive}`}
                      >
                        <div className={styles.dexHeader}>
                          <strong>Raydium CPMM Vault</strong>
                          <span className={styles.dexBadge}>SPL & Token-2022 Official SDK v2</span>
                        </div>
                        <p>{t.liquidityPage.raydiumDesc}</p>
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <Label>{t.liquidityPage.step2SelectToken}</Label>
                      {selectedToken && (
                        <span className={styles.balanceTag}>
                          {t.common.availableBalance}{" "}
                          {parseFloat(selectedToken.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <TokenSelector
                      tokens={userTokens}
                      selectedTokenMint={selectedTokenMint}
                      onSelectToken={(mint) => {
                        setSelectedTokenMint(mint);
                        setBaseAmount("");
                      }}
                      isLoading={isLoadingTokens}
                      disabled={isCreatingPool}
                      autoSelectFirst={true}
                      showQuickWalletCards={true}
                    />
                  </div>

                  {selectedToken && hasActiveFreezeAuth && (
                    <div className={styles.freezeWarningBox}>
                      <div>
                        <strong>{t.liquidityPage.freezeWarnTitle}</strong>
                        <p>{t.liquidityPage.freezeWarnDesc}</p>
                      </div>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={revokeFreezeIfActive}
                          onChange={(e) => setRevokeFreezeIfActive(e.target.checked)}
                        />
                        <span>{t.liquidityPage.freezeAutoRevokeCheck}</span>
                      </label>
                    </div>
                  )}

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label htmlFor="baseAmount">{t.liquidityPage.tokenAmountLabel}</Label>
                        <div className={styles.presetButtons}>
                          {ALLOCATION_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => handlePercentagePreset(preset.ratio)}
                              disabled={!selectedToken || isCreatingPool}
                              className={styles.presetBtn}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        id="baseAmount"
                        type="number"
                        step="any"
                        min="0"
                        placeholder="500000000"
                        value={baseAmount}
                        onChange={(e) => setBaseAmount(e.target.value)}
                        disabled={isCreatingPool || !selectedToken}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label htmlFor="quoteAmount">
                          {t.liquidityPage.initialLiquidityLabel} ({quoteToken})
                        </Label>
                        <div className={styles.quoteSwitch}>
                          {(["SOL", "USDC"] as QuoteAsset[]).map((asset) => (
                            <button
                              key={asset}
                              type="button"
                              onClick={() => setQuoteToken(asset)}
                              className={`${styles.quoteBtn} ${
                                quoteToken === asset ? styles.quoteBtnActive : ""
                              }`}
                            >
                              {asset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Input
                        id="quoteAmount"
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder={quoteToken === "SOL" ? "0.2" : "100"}
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        disabled={isCreatingPool}
                        required
                      />
                      {quoteToken === "SOL" && solBalance !== null && (
                        <span className={styles.helperText}>
                          {t.common.walletBalance} {solBalance.toFixed(4)} SOL ({cluster})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Phase 3: Optional Jito Atomic Bundle on Liquidity Launch */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(153, 69, 255, 0.4)",
                      background: "rgba(153, 69, 255, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: "#c4b5fd" }}>
                          ⚡{" "}
                          {isPt
                            ? `Jito Atomic Bundle: Pool + 1ª Compra Anti-Sniper (+${MODULAR_FEE_JITO_BUNDLE_SOL.toFixed(2)} SOL)`
                            : `Jito Atomic Bundle: Pool + Anti-Sniper First Buy (+${MODULAR_FEE_JITO_BUNDLE_SOL.toFixed(2)} SOL)`}
                        </strong>
                        <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                          {isPt
                            ? "Executa a criação do Pool + sua 1ª Compra no mesmo pacote Jito no Bloco Zero."
                            : "Executes Pool Initialization + your First Buy in the same Block-Zero Jito bundle."}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={jitoPoolBundleEnabled}
                        onChange={(e) => setJitoPoolBundleEnabled(e.target.checked)}
                      />
                    </div>

                    {jitoPoolBundleEnabled && (
                      <div className={styles.fieldGrid} style={{ marginTop: "0.75rem" }}>
                        <div className={styles.field}>
                          <Label>
                            {isPt ? "1ª Compra do Criador (SOL)" : "Creator First Buy (SOL)"}
                          </Label>
                          <Input
                            type="number"
                            step="0.05"
                            min="0.01"
                            value={jitoFirstBuySol}
                            onChange={(e) => setJitoFirstBuySol(e.target.value)}
                          />
                        </div>
                        <div className={styles.field}>
                          <Label>
                            {isPt
                              ? "Gorjeta Jito (0.001–0.01 SOL)"
                              : "Jito Validator Tip (SOL)"}
                          </Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            max="0.01"
                            value={jitoTipSol}
                            onChange={(e) => setJitoTipSol(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <Label>{t.liquidityPage.swapFeeTierLabel}</Label>
                      <div className={styles.feeTierGrid}>
                        {feeTiers.map((tier) => (
                          <button
                            key={tier.bps}
                            type="button"
                            onClick={() => setFeeTierBps(tier.bps)}
                            className={`${styles.feeTierBtn} ${
                              feeTierBps === tier.bps ? styles.feeTierBtnActive : ""
                            }`}
                          >
                            <strong>{tier.label}</strong>
                            <span>{tier.badge}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.field}>
                      <Label>{t.liquidityPage.activationScheduleLabel}</Label>
                      <div className={styles.launchToggle}>
                        <button
                          type="button"
                          onClick={() => setLaunchMode("immediate")}
                          className={launchMode === "immediate" ? styles.launchActive : ""}
                        >
                          {t.liquidityPage.immediateBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunchMode("scheduled")}
                          className={launchMode === "scheduled" ? styles.launchActive : ""}
                        >
                          {t.liquidityPage.scheduleTimeBtn}
                        </button>
                      </div>
                      {launchMode === "scheduled" && (
                        <Input
                          type="datetime-local"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                          disabled={isCreatingPool}
                        />
                      )}
                    </div>
                  </div>

                  <div className={styles.simulatorBox}>
                    <h4 className={styles.simulatorTitle}>{t.liquidityPage.simulatorTitle}</h4>
                    <div className={styles.simulatorMetrics}>
                      <div className={styles.metricCard}>
                        <span>{t.liquidityPage.initialPriceLabel}</span>
                        <strong>
                          {initialPrice > 0 ? initialPrice.toFixed(9) : "0.000000000"} {quoteToken}
                        </strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>{t.liquidityPage.impliedMcapLabel}</span>
                        <strong>
                          {estimatedMarketCap > 0
                            ? `${estimatedMarketCap.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })} ${quoteToken}`
                            : `0.00 ${quoteToken}`}
                        </strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>{t.liquidityPage.poolAllocationLabel}</span>
                        <strong>{supplyPercentageInPool.toFixed(1)}%</strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>
                          {t.liquidityPage.devFeeLabel} ({cluster})
                        </span>
                        <strong>{activeLpFeeSol.toFixed(2)} SOL</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className={styles.formFooter}>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isCreatingPool || !selectedToken || numericBase <= 0 || numericQuote <= 0
                    }
                  >
                    {isCreatingPool
                      ? statusStep || t.liquidityPage.initializingPoolStatus
                      : `${t.liquidityPage.submitAddBtn} (${activeLpFeeSol.toFixed(2)} SOL)`}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </main>

        <aside className={styles.sidebar}>
          <CostSummary
            operation={activeMode === "add" ? "createLiquidityPool" : "removeLiquidity"}
            liquiditySol={activeMode === "add" && quoteToken === "SOL" ? numericQuote : 0}
          />

          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>
                {activeMode === "add"
                  ? t.liquidityPage.sidebarAddTitle
                  : t.liquidityPage.sidebarWithdrawTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.infoContent}>
              <ul className={styles.tokenList}>
                {(activeMode === "add"
                  ? t.liquidityPage.sidebarAddBullets
                  : t.liquidityPage.sidebarWithdrawBullets
                ).map((b, idx) => (
                  <li key={idx}>
                    <strong>{b.title}</strong> {b.text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function AddLiquidityPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <AddLiquidityPageInner />
    </Suspense>
  );
}
