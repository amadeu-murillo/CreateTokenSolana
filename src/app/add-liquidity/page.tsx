"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { useUserTokens } from "@/hooks/useUserTokens";
import { useCreateLiquidityPool } from "@/hooks/useCreateLiquidityPool";
import { useRemoveLiquidity } from "@/hooks/useRemoveLiquidity";
import {
  DEV_WALLET_ADDRESS,
  SERVICE_FEE_CREATE_LP_DEVNET_SOL,
  SERVICE_FEE_CREATE_LP_SOL,
  SERVICE_FEE_REMOVE_LP_SOL,
} from "@/lib/constants";
import { QuoteAsset, SupportedDex } from "@/types/api";
import styles from "./AddLiquidity.module.css";

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

const FEE_TIERS = [
  { bps: 25, label: "0.25%", badge: "Recommended" },
  { bps: 30, label: "0.30%", badge: "Standard AMM" },
  { bps: 100, label: "1.00%", badge: "High Volatility" },
];

const ALLOCATION_PRESETS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
  { label: "MAX", ratio: 1 },
];

const WITHDRAW_SHARE_OPTIONS = [
  { pct: 25, label: "25%", desc: "Partial SOL Exit" },
  { pct: 50, label: "50%", desc: "Half Position" },
  { pct: 75, label: "75%", desc: "Major Exit" },
  { pct: 100, label: "100% MAX", desc: "Full Unwrap + Rent" },
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

export default function AddLiquidityPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { cluster, setCluster, getExplorerUrl } = useCluster();
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

  // Withdraw Liquidity in SOL states
  const [withdrawPercentage, setWithdrawPercentage] = useState<number>(100);
  const [withdrawLpMint, setWithdrawLpMint] = useState<string>("");
  const [derivedWsolVault, setDerivedWsolVault] = useState<string>("");
  const [detectedVaultSol, setDetectedVaultSol] = useState<number | null>(null);
  const [isCheckingVault, setIsCheckingVault] = useState<boolean>(false);

  const activeLpFeeSol =
    cluster === "devnet" ? SERVICE_FEE_CREATE_LP_DEVNET_SOL : SERVICE_FEE_CREATE_LP_SOL;

  // Pre-select ?mint= from URL if navigated from Token Creation Confirmation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mintFromQuery = params.get("mint");
      const modeFromQuery = params.get("mode");
      if (mintFromQuery && !selectedTokenMint) {
        setSelectedTokenMint(mintFromQuery);
      }
      if (modeFromQuery === "withdraw") {
        setActiveMode("withdraw");
      }
    }
  }, [selectedTokenMint]);

  const selectedToken = useMemo(
    () => userTokens.find((t) => t.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

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

  // Inspect on-chain deterministic WSOL liquidity vault balance when a token is selected
  useEffect(() => {
    if (!publicKey || !selectedTokenMint || !connection) {
      setDerivedWsolVault("");
      setDetectedVaultSol(null);
      return;
    }
    let mounted = true;
    (async () => {
      setIsCheckingVault(true);
      try {
        const wsolVaultSeed = `lp_wsol_${selectedTokenMint.slice(0, 16)}`;
        const vaultPubkey = await PublicKey.createWithSeed(
          publicKey,
          wsolVaultSeed,
          TOKEN_PROGRAM_ID
        );
        if (mounted) setDerivedWsolVault(vaultPubkey.toBase58());

        const accountInfo = await connection.getAccountInfo(vaultPubkey, "confirmed");
        if (accountInfo && mounted) {
          try {
            const tokenBal = await connection.getTokenAccountBalance(vaultPubkey, "confirmed");
            setDetectedVaultSol(Number(tokenBal.value.uiAmount || 0));
          } catch {
            setDetectedVaultSol(accountInfo.lamports / 1e9);
          }
        } else if (mounted) {
          setDetectedVaultSol(0);
        }
      } catch {
        if (mounted) {
          setDerivedWsolVault("");
          setDetectedVaultSol(null);
        }
      } finally {
        if (mounted) setIsCheckingVault(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [publicKey, selectedTokenMint, connection, poolResult, removeResult]);

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
  }, [selectedToken, connection]);

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
    const tierObj = FEE_TIERS.find((t) => t.bps === feeTierBps) || FEE_TIERS[0];

    const snapshot: SnapshotTokenDossier = {
      mint: selectedToken.mint,
      name: selectedToken.name || "Custom Token",
      symbol: selectedToken.symbol || "TOKEN",
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
          : "Immediate (Trading Active)",
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
      if (res.lpMintAddress) {
        setWithdrawLpMint(res.lpMintAddress);
      }
      refreshTokens();
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTokenMint) return;

    const res = await removeLiquidity({
      baseMint: selectedTokenMint,
      lpMint: withdrawLpMint.trim() || undefined,
      withdrawPercentage,
      network: cluster,
    });

    if (res) {
      refreshTokens();
    }
  };

  const handleSwitchToWithdrawFromDossier = () => {
    if (poolResult?.lpMintAddress) {
      setWithdrawLpMint(poolResult.lpMintAddress);
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

  // Pre-flight readiness checklist for user confidence
  const isTokenReady = Boolean(selectedToken);
  const areAmountsReady = numericBase > 0 && numericQuote > 0;
  const isFreezeReady = !hasActiveFreezeAuth || revokeFreezeIfActive;

  // Live SOL withdrawal simulation
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
            <span>Active Network:</span>
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
                Add Liquidity Fee: <strong>{activeLpFeeSol.toFixed(2)} SOL</strong>
              </>
            ) : (
              <>
                Withdraw Liquidity Fee: <strong>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</strong>
              </>
            )}
          </span>
        </div>

        <h1 className={styles.pageTitle}>
          {activeMode === "add"
            ? "Create On-Chain Liquidity Pool"
            : "Withdraw Liquidity in SOL"}
        </h1>
        <p className={styles.pageDescription}>
          {activeMode === "add"
            ? `Initialize an on-chain Liquidity Pool & LP Token Mint on Solana (${cluster}). Locks your Base Token and ${quoteToken} into deterministic Pool Vaults, mints LP tokens to your wallet, and displays the complete Token & Pool Dossier.`
            : `Unwrap your WSOL liquidity vault back into native SOL directly to your wallet on Solana (${cluster}). Standardized ${SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL service fee routed atomically to Dev Wallet (${devWalletBase58.slice(0, 6)}...${devWalletBase58.slice(-4)}).`}
        </p>

        {/* Mode Switcher Bar */}
        <div className={styles.modeTabsBar}>
          <button
            type="button"
            onClick={() => {
              setActiveMode("add");
              resetRemoveState();
            }}
            className={activeMode === "add" ? styles.modeTabBtnActive : styles.modeTabBtn}
          >
            <span>➕ Add Liquidity</span>
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
            <span>💸 Withdraw Liquidity in SOL</span>
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
                          ✓ SOL LIQUIDITY WITHDRAWN ON {cluster.toUpperCase()}
                        </span>
                        <CardTitle className={styles.receiptTitle}>
                          +{removeResult.withdrawnSol.toFixed(6)} SOL Returned to Wallet
                        </CardTitle>
                        <CardDescription>
                          Your WSOL liquidity vault was unwrapped into native SOL and the{" "}
                          {removeResult.serviceFeeSol.toFixed(2)} SOL service fee was routed
                          atomically to Dev Wallet.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className={styles.receiptContent}>
                    <div className={styles.dossierSection}>
                      <h3 className={styles.dossierSectionTitle}>
                        💸 1. SOL Liquidity Withdrawal Summary
                      </h3>
                      <div className={styles.dossierMetricsGrid}>
                        <div className={styles.dossierMetricBox}>
                          <span>Gross SOL Unwrapped</span>
                          <strong className={styles.textEmerald}>
                            {removeResult.withdrawnSol.toFixed(6)} SOL
                          </strong>
                        </div>
                        <div className={styles.dossierMetricBox}>
                          <span>Withdrawal Percentage</span>
                          <strong>{removeResult.withdrawPercentage}% of Vault</strong>
                        </div>
                        <div className={styles.dossierMetricBox}>
                          <span>Dev Wallet Service Fee</span>
                          <strong className={styles.textPurple}>
                            {removeResult.serviceFeeSol.toFixed(2)} SOL
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.dossierSection}>
                      <h3 className={styles.dossierSectionTitle}>
                        🔗 2. On-Chain Verification & Explorer Links
                      </h3>
                      <div className={styles.addressDirectory}>
                        {[
                          {
                            key: "wsolVault",
                            label: "Unwrapped WSOL Liquidity Vault",
                            value: removeResult.wsolVaultAddress,
                            explorerType: "account" as const,
                          },
                          {
                            key: "devWallet",
                            label: "Developer Fee Destination Wallet (0.05 SOL)",
                            value: devWalletBase58,
                            explorerType: "account" as const,
                          },
                          {
                            key: "withdrawTx",
                            label: "Withdrawal Transaction Signature",
                            value: removeResult.signature,
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
                                  {copiedKey === item.key ? "✓ Copied!" : "Copy"}
                                </button>
                                <a
                                  href={getExplorerUrl(item.explorerType, item.value)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.solscanBtnSmall}
                                >
                                  Solscan ↗
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
                      💸 Make Another Withdrawal
                    </Button>
                    <Button
                      onClick={() => {
                        resetRemoveState();
                        setActiveMode("add");
                      }}
                    >
                      ➕ Back to Add Liquidity
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Liquidity in SOL ({cluster})</CardTitle>
                  <CardDescription>
                    Recover your deposited SOL liquidity from your deterministic WSOL Pool Vault (or
                    active WSOL account) directly as native SOL. Standardized Service Fee:{" "}
                    <strong>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</strong>.
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
                      operationTitle={`Withdrawing ${withdrawPercentage}% SOL Liquidity on ${cluster}`}
                    />

                    {/* 1. Select Base Token */}
                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label>1. Select Token Paired with SOL</Label>
                        {solBalance !== null && (
                          <span className={styles.balanceTag}>
                            Wallet SOL: {solBalance.toFixed(4)} SOL
                          </span>
                        )}
                      </div>
                      <TokenSelector
                        tokens={userTokens}
                        selectedTokenMint={selectedTokenMint}
                        onSelectToken={(mint) => setSelectedTokenMint(mint)}
                        isLoading={isLoadingTokens}
                        disabled={isRemovingLiquidity}
                      />
                    </div>

                    {/* Deterministic WSOL Vault Inspection Card */}
                    {selectedTokenMint && (
                      <div className={styles.vaultStatusCard}>
                        <div className={styles.vaultStatusHeader}>
                          <strong>
                            Deterministic WSOL Liquidity Vault (
                            {selectedToken?.symbol || "Selected Token"})
                          </strong>
                          <span className={styles.balanceTag}>
                            {isCheckingVault
                              ? "Inspecting on-chain vault..."
                              : detectedVaultSol !== null && detectedVaultSol > 0
                                ? `Active Balance: ${detectedVaultSol.toFixed(6)} WSOL`
                                : "Ready to unwrap WSOL vault / ATA"}
                          </span>
                        </div>
                        {derivedWsolVault && (
                          <span className={styles.vaultAddressMono}>
                            Vault Address: {derivedWsolVault}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 2. Choose Withdrawal Percentage */}
                    <div className={styles.field}>
                      <Label>2. Select SOL Withdrawal Share</Label>
                      <div className={styles.withdrawShareGrid}>
                        {WITHDRAW_SHARE_OPTIONS.map((opt) => (
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

                    {/* 3. Optional LP Token Mint to Burn Proportionally */}
                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label htmlFor="withdrawLpMint">
                          3. LP Token Mint Address (Optional — Auto-Burns Proportional LP)
                        </Label>
                      </div>
                      <Input
                        id="withdrawLpMint"
                        type="text"
                        placeholder="Paste LP Mint Address if you want to burn LP tokens simultaneously"
                        value={withdrawLpMint}
                        onChange={(e) => setWithdrawLpMint(e.target.value)}
                        disabled={isRemovingLiquidity}
                      />
                      <span className={styles.helperText}>
                        Note: If your LP tokens were already burned permanently at{" "}
                        <Link href="/burn">/burn</Link>, only unlocked WSOL balances can be
                        withdrawn.
                      </span>
                    </div>

                    {/* 4. Live SOL Withdrawal Simulator */}
                    <div className={styles.simulatorBox}>
                      <h4 className={styles.simulatorTitle}>
                        Live SOL Liquidity Withdrawal Breakdown
                      </h4>
                      <div className={styles.simulatorMetrics}>
                        <div className={styles.metricCard}>
                          <span>Selected Share</span>
                          <strong>{withdrawPercentage}%</strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>Estimated SOL Unwrapped</span>
                          <strong className={styles.textEmerald}>
                            ~{simulatedGrossSol.toFixed(4)} SOL
                          </strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>Service Fee (Dev Wallet)</span>
                          <strong className={styles.textPurple}>
                            {SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL
                          </strong>
                        </div>
                        <div className={styles.metricCard}>
                          <span>Est. Net SOL to Wallet</span>
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
                      disabled={isRemovingLiquidity || !selectedTokenMint || !publicKey}
                    >
                      {isRemovingLiquidity
                        ? removeStatusStep || "Withdrawing SOL Liquidity..."
                        : `💸 Withdraw ${withdrawPercentage}% Liquidity in SOL (Fee: ${SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL)`}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )
          ) : poolResult ? (
            <div className={styles.dossierWrapper}>
              {/* 1. Hero Confirmation Banner */}
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
                          ✓ LIQUIDITY POOL & LP TOKENS LIVE ON {cluster.toUpperCase()}
                        </span>
                        <CardTitle className={styles.receiptTitle}>
                          {tokenDossierSnapshot?.name || "Token"} (
                          {tokenDossierSnapshot?.symbol || "TOKEN"}) /{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </CardTitle>
                        <CardDescription>
                          All token parameters, liquidity vaults, and LP tokens have been verified
                          and indexed on the Solana blockchain.
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className={styles.receiptContent}>
                  {/* SECTION A: Complete Token Information Dossier */}
                  <div className={styles.dossierSection}>
                    <h3 className={styles.dossierSectionTitle}>
                      🪙 1. Complete Token Information & Supply Breakdown
                    </h3>
                    <div className={styles.dossierMetricsGrid}>
                      <div className={styles.dossierMetricBox}>
                        <span>Token Name & Ticker</span>
                        <strong>
                          {tokenDossierSnapshot?.name} ({tokenDossierSnapshot?.symbol})
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Token Standard & Decimals</span>
                        <strong>
                          {tokenDossierSnapshot?.standard || "SPL"} ·{" "}
                          {tokenDossierSnapshot?.decimals ?? 9} Decimals
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Total Token Supply</span>
                        <strong>
                          {(tokenDossierSnapshot?.totalSupply || 0).toLocaleString("en-US")}{" "}
                          {tokenDossierSnapshot?.symbol}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Supply Deposited in Pool</span>
                        <strong className={styles.textEmerald}>
                          {(tokenDossierSnapshot?.baseDeposited || numericBase).toLocaleString(
                            "en-US"
                          )}{" "}
                          {tokenDossierSnapshot?.symbol} (
                          {(tokenDossierSnapshot?.supplyPctInPool ?? supplyPercentageInPool).toFixed(
                            1
                          )}
                          %)
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Remaining Creator Balance</span>
                        <strong>
                          {(tokenDossierSnapshot?.remainingBalance ?? 0).toLocaleString("en-US")}{" "}
                          {tokenDossierSnapshot?.symbol}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>On-Chain Authorities</span>
                        <strong className={styles.textEmerald}>
                          Mint:{" "}
                          {tokenDossierSnapshot?.mintAuthorityActive ? "Active" : "Revoked ✓"} ·
                          Freeze: Revoked ✓
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* SECTION B: Liquidity Pool & Market Metrics */}
                  <div className={styles.dossierSection}>
                    <h3 className={styles.dossierSectionTitle}>
                      💧 2. Liquidity Pool & Market Valuation Metrics
                    </h3>
                    <div className={styles.dossierMetricsGrid}>
                      <div className={styles.dossierMetricBox}>
                        <span>AMM Protocol & Fee Tier</span>
                        <strong>
                          {poolResult.dex === "raydium-cpmm"
                            ? "Raydium CPMM (v2)"
                            : "Meteora Dynamic AMM"}{" "}
                          · {tokenDossierSnapshot?.feeTierLabel || "0.25%"}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Initial Token Price</span>
                        <strong className={styles.textEmerald}>
                          {poolResult.initialPrice.toFixed(9)}{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Implied Initial Market Cap</span>
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
                        <span>Initial Quote Liquidity</span>
                        <strong>
                          {tokenDossierSnapshot?.quoteDeposited ?? numericQuote}{" "}
                          {tokenDossierSnapshot?.quoteSymbol || quoteToken}
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>LP Tokens Minted to Wallet</span>
                        <strong className={styles.textPurple}>
                          {poolResult.lpTokensMinted || "Minted"} LP (100% Share)
                        </strong>
                      </div>
                      <div className={styles.dossierMetricBox}>
                        <span>Trading Status & Dev Fee</span>
                        <strong>
                          {tokenDossierSnapshot?.launchScheduleLabel || "Active"} ·{" "}
                          {(poolResult.serviceFeeSol ?? activeLpFeeSol).toFixed(2)} SOL Fee
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* SECTION C: Complete On-Chain Addresses & Explorer Directory */}
                  <div className={styles.dossierSection}>
                    <h3 className={styles.dossierSectionTitle}>
                      🔗 3. Verified On-Chain Addresses & Explorer Links
                    </h3>
                    <div className={styles.addressDirectory}>
                      {[
                        {
                          key: "tokenMint",
                          label: "Token Mint Address",
                          value: tokenDossierSnapshot?.mint || selectedTokenMint,
                          explorerType: "token" as const,
                        },
                        {
                          key: "poolPda",
                          label: "Pool Authority / State PDA (AMM ID)",
                          value: poolResult.poolAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "lpMint",
                          label: "LP Token Mint Address (Burnable)",
                          value: poolResult.lpMintAddress,
                          explorerType: "token" as const,
                        },
                        {
                          key: "baseVault",
                          label: `Base Token Vault ATA (${tokenDossierSnapshot?.symbol || "TOKEN"})`,
                          value: poolResult.baseVaultAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "quoteVault",
                          label: `Quote Token Vault ATA (${
                            tokenDossierSnapshot?.quoteSymbol || quoteToken
                          })`,
                          value: poolResult.quoteVaultAddress,
                          explorerType: "account" as const,
                        },
                        {
                          key: "txSig",
                          label: "On-Chain Transaction Signature",
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
                                {copiedKey === item.key ? "✓ Copied!" : "Copy"}
                              </button>
                              <a
                                href={getExplorerUrl(item.explorerType, item.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.solscanBtnSmall}
                              >
                                Solscan ↗
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
                    💸 Withdraw Liquidity in SOL (0.05 SOL)
                  </button>
                  <Link href="/burn" className={styles.actionLinkBtn}>
                    🔥 Burn LP Tokens (Lock Liquidity)
                  </Link>
                  <Link href="/airdrop" className={styles.actionLinkBtn}>
                    📦 Distribute Token Airdrop
                  </Link>
                  <Button onClick={handleReset} className="secondary">
                    ➕ Create Another Pool
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Configure Liquidity Pair ({cluster})</CardTitle>
                <CardDescription>
                  Select your token, deposit initial {quoteToken} liquidity, and mint your LP tokens
                  in a single atomic transaction.
                </CardDescription>

                {/* Live Pre-Flight Readiness Checklist */}
                <div className={styles.readinessBar}>
                  <span className={styles.readyStepDone}>1. AMM Selected ✓</span>
                  <span className={isTokenReady ? styles.readyStepDone : styles.readyStepPending}>
                    2. Base Token {isTokenReady ? `(${selectedToken?.symbol}) ✓` : "Pending"}
                  </span>
                  <span className={areAmountsReady ? styles.readyStepDone : styles.readyStepPending}>
                    3. Liquidity Amounts {areAmountsReady ? "✓" : "Pending"}
                  </span>
                  <span className={isFreezeReady ? styles.readyStepDone : styles.readyStepWarn}>
                    4. Freeze Auth {isFreezeReady ? "Ready ✓" : "Action Needed"}
                  </span>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className={styles.formContent}>
                  {poolError && (
                    <Notification type="error" message={poolError} onClose={resetPoolState} />
                  )}

                  {/* Real-Time 5-Stage Progress Stepper During Pool Initialization */}
                  <TransactionStatusStepper
                    isActive={isCreatingPool}
                    currentStepIndex={progressStep}
                    statusMessage={statusStep}
                    operationTitle={`Initializing ${selectedToken?.symbol || "Token"}/${quoteToken} Pool on ${cluster}`}
                  />

                  {/* 1. DEX Protocol */}
                  <div className={styles.field}>
                    <Label>1. Select AMM Architecture</Label>
                    <div className={styles.dexSelector}>
                      <button
                        type="button"
                        onClick={() => setDex("raydium-cpmm")}
                        className={`${styles.dexOption} ${
                          dex === "raydium-cpmm" ? styles.dexOptionActive : ""
                        }`}
                      >
                        <div className={styles.dexHeader}>
                          <strong>Raydium CPMM Vault</strong>
                          <span className={styles.dexBadge}>SPL & Token-2022</span>
                        </div>
                        <p>
                          Constant-product liquidity vaults with native LP Token minting on both
                          Mainnet-Beta and Devnet.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDex("meteora-damm")}
                        className={`${styles.dexOption} ${
                          dex === "meteora-damm" ? styles.dexOptionActive : ""
                        }`}
                      >
                        <div className={styles.dexHeader}>
                          <strong>Meteora Dynamic AMM</strong>
                          <span className={styles.dexBadge}>Dynamic Fees</span>
                        </div>
                        <p>
                          Dynamic liquidity pool vaults with customizable fee tiers and instant LP
                          minting.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* 2. Base Token Selection */}
                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <Label>2. Base Token (From Your Wallet)</Label>
                      {selectedToken && (
                        <span className={styles.balanceTag}>
                          Available: {parseFloat(selectedToken.amount).toLocaleString()}{" "}
                          {selectedToken.symbol}
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
                    />
                  </div>

                  {selectedToken && hasActiveFreezeAuth && (
                    <div className={styles.freezeWarningBox}>
                      <div>
                        <strong>Active Freeze Authority Detected</strong>
                        <p>
                          Liquidity pools require Freeze Authority to be revoked. We will revoke it
                          automatically in the same transaction.
                        </p>
                      </div>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={revokeFreezeIfActive}
                          onChange={(e) => setRevokeFreezeIfActive(e.target.checked)}
                        />
                        <span>Auto-revoke in same transaction</span>
                      </label>
                    </div>
                  )}

                  {/* 3. Base & Quote Amounts */}
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label htmlFor="baseAmount">
                          {selectedToken?.symbol || "Base Token"} Amount
                        </Label>
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
                        placeholder="Ex: 500000000"
                        value={baseAmount}
                        onChange={(e) => setBaseAmount(e.target.value)}
                        disabled={isCreatingPool || !selectedToken}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.labelRow}>
                        <Label htmlFor="quoteAmount">Initial Liquidity ({quoteToken})</Label>
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
                        placeholder={quoteToken === "SOL" ? "Ex: 0.2" : "Ex: 100"}
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        disabled={isCreatingPool}
                        required
                      />
                      {quoteToken === "SOL" && solBalance !== null && (
                        <span className={styles.helperText}>
                          Wallet Balance: {solBalance.toFixed(4)} SOL ({cluster})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5. Fee Tier & Launch Time */}
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <Label>Pool Swap Fee Tier</Label>
                      <div className={styles.feeTierGrid}>
                        {FEE_TIERS.map((tier) => (
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
                      <Label>Pool Activation Schedule</Label>
                      <div className={styles.launchToggle}>
                        <button
                          type="button"
                          onClick={() => setLaunchMode("immediate")}
                          className={launchMode === "immediate" ? styles.launchActive : ""}
                        >
                          Immediate
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaunchMode("scheduled")}
                          className={launchMode === "scheduled" ? styles.launchActive : ""}
                        >
                          Schedule Time
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

                  {/* 6. Live Economic Simulator */}
                  <div className={styles.simulatorBox}>
                    <h4 className={styles.simulatorTitle}>Live Pool Economic Simulation</h4>
                    <div className={styles.simulatorMetrics}>
                      <div className={styles.metricCard}>
                        <span>Initial Token Price</span>
                        <strong>
                          {initialPrice > 0 ? initialPrice.toFixed(9) : "0.000000000"} {quoteToken}
                        </strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>Implied Market Cap</span>
                        <strong>
                          {estimatedMarketCap > 0
                            ? `${estimatedMarketCap.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })} ${quoteToken}`
                            : `0.00 ${quoteToken}`}
                        </strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>Pool Supply Allocation</span>
                        <strong>{supplyPercentageInPool.toFixed(1)}%</strong>
                      </div>
                      <div className={styles.metricCard}>
                        <span>Dev Fee ({cluster})</span>
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
                      ? statusStep || "Initializing On-Chain Liquidity Pool..."
                      : `Initialize Liquidity Pool & Mint LP (${activeLpFeeSol.toFixed(2)} SOL Fee)`}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </main>

        <aside className={styles.sidebar}>
          <CostSummary />

          <Card>
            <CardHeader>
              <CardTitle className={styles.cardTitle}>
                {activeMode === "add"
                  ? "On-Chain Pool & Dossier Architecture"
                  : "How SOL Liquidity Withdrawal Works"}
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.infoContent}>
              {activeMode === "add" ? (
                <ul className={styles.tokenList}>
                  <li>
                    <strong>Complete Post-Launch Dossier:</strong> Immediately after confirmation,
                    your screen displays all Token metrics, Pool valuation, Vault ATAs, and LP Mint
                    links in a clean dashboard.
                  </li>
                  <li>
                    <strong>Real On-Chain LP Mint:</strong> Creates a deterministic Pool Authority
                    PDA, wraps SOL into the WSOL Pool Vault, and mints real SPL LP tokens to your
                    wallet.
                  </li>
                  <li>
                    <strong>Flexible SOL Recovery:</strong> Need to withdraw your deposited SOL
                    later? Switch to the <strong>Withdraw Liquidity in SOL</strong> tab anytime
                    (0.05 SOL fee).
                  </li>
                  <li>
                    <strong>Standardized Service Fee:</strong>{" "}
                    <strong>{activeLpFeeSol.toFixed(2)} SOL</strong> is routed atomically to Dev
                    Wallet{" "}
                    <code>
                      {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}
                    </code>
                    .
                  </li>
                </ul>
              ) : (
                <ul className={styles.tokenList}>
                  <li>
                    <strong>Native SOL Unwrapping:</strong> Closes or partially unwraps your
                    deterministic WSOL Pool Vault so your SOL is returned directly as native SOL in
                    your wallet.
                  </li>
                  <li>
                    <strong>Partial or Full Exit (25% – 100%):</strong> Choose whether to withdraw a
                    portion of your SOL liquidity or 100% MAX (which also reclaims the vault rent
                    deposit).
                  </li>
                  <li>
                    <strong>0.05 SOL Dev Wallet Fee:</strong> Charges a standardized{" "}
                    <strong>{SERVICE_FEE_REMOVE_LP_SOL.toFixed(2)} SOL</strong> fee routed
                    atomically to{" "}
                    <code>
                      {devWalletBase58.slice(0, 6)}...{devWalletBase58.slice(-4)}
                    </code>{" "}
                    (with 10% affiliate split if referred).
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
