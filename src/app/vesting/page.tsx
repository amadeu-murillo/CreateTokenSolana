"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUserTokens } from "@/hooks/useUserTokens";
import { TokenSelector } from "@/components/TokenSelector";
import CostSummary from "@/components/CostSummary";
import Notification from "@/components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AFFILIATE_COMMISSION_RATE,
  SERVICE_FEE_TOKEN_VESTING_LOCK_SOL,
} from "@/lib/constants";
import { computeSplit } from "@/config/pricing";
import { isValidPublicKey, verifyTransactionIntegrity } from "@/lib/security";

interface StoredVestingLock {
  escrowAddress: string;
  escrowSeed: string;
  mint: string;
  symbol: string;
  amountUi: string;
  unlockUnix: number;
  beneficiary: string;
  signature: string;
  network: string;
  createdAt: number;
}

function VestingCertificateCanvas({
  lock,
  explorerUrl,
}: {
  lock: StoredVestingLock;
  explorerUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#070B19");
    bgGrad.addColorStop(0.5, "#11162B");
    bgGrad.addColorStop(1, "#06231D");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const borderGrad = ctx.createLinearGradient(0, 0, w, 0);
    borderGrad.addColorStop(0, "#14F195");
    borderGrad.addColorStop(0.5, "#00D1FF");
    borderGrad.addColorStop(1, "#9945FF");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.fillStyle = "rgba(20, 241, 149, 0.16)";
    ctx.fillRect(54, 46, 560, 44);
    ctx.strokeStyle = "#14F195";
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 46, 560, 44);

    ctx.fillStyle = "#14F195";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("🔒 VERIFIED ON-CHAIN TOKEN LOCK CERTIFICATE", 74, 74);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px Inter, sans-serif";
    ctx.fillText("Verified On-Chain Token Lock Certificate", 54, 140);

    ctx.fillStyle = "#14F195";
    ctx.font = "bold 40px monospace";
    ctx.fillText(
      `LOCKED ${Number(lock.amountUi).toLocaleString("en-US")} $${lock.symbol}`,
      54,
      198
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(54, 224, w - 108, 210);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(54, 224, w - 108, 210);

    const shortMint = `${lock.mint.slice(0, 12)}...${lock.mint.slice(-10)}`;
    const shortEscrow = `${lock.escrowAddress.slice(0, 12)}...${lock.escrowAddress.slice(-10)}`;
    const shortSig = `${lock.signature.slice(0, 16)}...${lock.signature.slice(-12)}`;
    const unlockStr = new Date(lock.unlockUnix * 1000).toUTCString();

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 17px Inter, sans-serif";
    ctx.fillText("Token / LP Mint:", 78, 266);
    ctx.fillText("Escrow Vault Account:", 78, 306);
    ctx.fillText("Unlock Date (UTC):", 78, 346);
    ctx.fillText("Memo TX Signature:", 78, 386);
    ctx.fillText("Beneficiary Wallet:", 78, 420);

    ctx.fillStyle = "#00D1FF";
    ctx.font = "bold 18px monospace";
    ctx.fillText(shortMint, 290, 266);
    ctx.fillStyle = "#F8FAFC";
    ctx.fillText(`${shortEscrow} (seed: ${lock.escrowSeed})`, 290, 306);
    ctx.fillStyle = "#14F195";
    ctx.fillText(unlockStr, 290, 346);
    ctx.fillStyle = "#C4B5FD";
    ctx.fillText(shortSig, 290, 386);
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(
      `${lock.beneficiary.slice(0, 10)}...${lock.beneficiary.slice(-8)}`,
      290,
      420
    );

    ctx.fillStyle = "#A78BFA";
    ctx.font = "bold 17px Inter, sans-serif";
    ctx.fillText(
      "Verified On-Chain via SPL Memo Program · https://www.createtokensol.store/vesting",
      54,
      482
    );
  }, [lock]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `verified-token-lock-${lock.symbol.toLowerCase()}-${lock.unlockUnix}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1rem",
        borderRadius: "0.85rem",
        border: "1px solid rgba(20, 241, 149, 0.4)",
        background: "rgba(9, 9, 11, 0.8)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <strong style={{ color: "#14f195" }}>
          🏆 Verified On-Chain Token Lock Certificate
        </strong>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#14f195", fontSize: "0.82rem", textDecoration: "underline" }}
        >
          Ver no Solscan ↗
        </a>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={510}
        style={{ width: "100%", height: "auto", borderRadius: "0.65rem" }}
      />

      <div style={{ display: "flex", gap: "0.65rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        <Button type="button" onClick={handleDownloadPng}>
          ⬇️ Baixar Certificado PNG
        </Button>
      </div>
    </div>
  );
}

function VestingPageInner() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const { locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const { tokens: userTokens, isLoading: isLoadingTokens, refreshTokens } = useUserTokens();

  const [activeTab, setActiveTab] = useState<"create" | "my-locks" | "verify">("create");
  const [selectedMint, setSelectedMint] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [unlockDateStr, setUnlockDateStr] = useState<string>(() => {
    const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    return future.toISOString().slice(0, 16);
  });
  const [beneficiaryInput, setBeneficiaryInput] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
    txId?: string | null;
  } | null>(null);

  const [myLocks, setMyLocks] = useState<StoredVestingLock[]>([]);
  const [lastCreatedLock, setLastCreatedLock] = useState<StoredVestingLock | null>(null);

  const [verifyMintInput, setVerifyMintInput] = useState<string>("");
  const [verifiedLocks, setVerifiedLocks] = useState<StoredVestingLock[]>([]);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Capture ?ref= and ?mint= (SSR-safe without Suspense bailout)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && isValidPublicKey(ref)) {
        localStorage.setItem("affiliateRef", ref.trim());
      }
      const mintFromQuery = params.get("mint");
      if (mintFromQuery && isValidPublicKey(mintFromQuery)) {
        setSelectedMint(mintFromQuery.trim());
        setVerifyMintInput(mintFromQuery.trim());
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load saved locks from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cts_vesting_locks");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMyLocks(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  const selectedToken = useMemo(
    () => userTokens.find((tk) => tk.mint === selectedMint) || null,
    [userTokens, selectedMint]
  );

  const splitInfo = computeSplit(SERVICE_FEE_TOKEN_VESTING_LOCK_SOL);

  const handleCreateLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !sendTransaction || !connection) {
      setNotification({
        type: "error",
        message: isPt
          ? "Conecte sua carteira Solana antes de criar um Lock."
          : "Please connect your Solana wallet before creating a Lock.",
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!selectedMint || !numericAmount || numericAmount <= 0) return;

    const unlockMs = Date.parse(unlockDateStr);
    const unlockUnix =
      !isNaN(unlockMs) && unlockMs > Date.now()
        ? Math.floor(unlockMs / 1000)
        : Math.floor(Date.now() / 1000) + 86400;

    setIsSubmitting(true);
    setNotification(null);
    setProgressStep(1);
    setStatusStep(
      isPt
        ? "1/4: Construindo conta de Escrow determinística e Memo on-chain..."
        : "1/4: Building deterministic Escrow account and on-chain Memo..."
    );

    try {
      const affiliateRef =
        typeof window !== "undefined" ? localStorage.getItem("affiliateRef") : null;

      const res = await fetch("/api/vesting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lock",
          mint: selectedMint,
          amount: numericAmount,
          unlockTimestamp: unlockUnix,
          beneficiary: beneficiaryInput.trim() || publicKey.toBase58(),
          wallet: publicKey.toBase58(),
          programId: selectedToken?.programId,
          affiliate: affiliateRef,
          network: cluster,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to build Token Vesting transaction.");
      }

      setProgressStep(2);
      setStatusStep(
        isPt
          ? "2/4: Verificando integridade dos programas (SPL Token + Memo Program)..."
          : "2/4: Auditing program whitelist (SPL Token + Memo Program)..."
      );

      const txBuf = Buffer.from(data.transaction, "base64");
      const vTx = VersionedTransaction.deserialize(new Uint8Array(txBuf));

      const integrity = verifyTransactionIntegrity(vTx, publicKey.toBase58(), { operation: "tokenVestingLock", affiliateWallet: affiliateRef });
      if (!integrity.valid) {
        throw new Error(integrity.reason || "Transaction failed security check.");
      }

      setProgressStep(3);
      setStatusStep(
        isPt
          ? "3/4: Assine a transação de Lock na sua carteira..."
          : "3/4: Approve the Lock transaction in your wallet..."
      );

      const sig = await sendTransaction(vTx, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      setProgressStep(4);
      setStatusStep(
        isPt
          ? "4/4: Confirmando Escrow e registro Memo on-chain..."
          : "4/4: Confirming Escrow & on-chain Memo record..."
      );

      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: data.blockhash,
          lastValidBlockHeight: data.lastValidBlockHeight,
        },
        "confirmed"
      );

      const cleanSymbol =
        selectedToken?.symbol || selectedMint.slice(0, 5).toUpperCase();
      const newRecord: StoredVestingLock = {
        escrowAddress: data.escrowAddress,
        escrowSeed: data.escrowSeed,
        mint: selectedMint,
        symbol: cleanSymbol,
        amountUi: String(numericAmount),
        unlockUnix,
        beneficiary: data.beneficiary,
        signature: sig,
        network: cluster,
        createdAt: Date.now(),
      };

      const nextLocks = [newRecord, ...myLocks];
      setMyLocks(nextLocks);
      setLastCreatedLock(newRecord);
      try {
        localStorage.setItem("cts_vesting_locks", JSON.stringify(nextLocks));
      } catch {
        // Ignore
      }

      if (affiliateRef && affiliateRef !== publicKey.toBase58()) {
        fetch("/api/record-commission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateWallet: affiliateRef,
            commissionAmountSOL: Number(
              (SERVICE_FEE_TOKEN_VESTING_LOCK_SOL * AFFILIATE_COMMISSION_RATE).toFixed(4)
            ),
            transactionSignature: sig,
            tokenCreatorWallet: publicKey.toBase58(),
            mintAddress: selectedMint,
            network: cluster,
          }),
        }).catch(() => {});
      }

      setNotification({
        type: "success",
        message: isPt
          ? `✓ ${numericAmount.toLocaleString()} $${cleanSymbol} trancados on-chain até ${new Date(
              unlockUnix * 1000
            ).toUTCString()}!`
          : `✓ Locked ${numericAmount.toLocaleString()} $${cleanSymbol} on-chain until ${new Date(
              unlockUnix * 1000
            ).toUTCString()}!`,
        txId: sig,
      });
      setAmount("");
      refreshTokens();
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to create Token Vesting Lock.",
      });
    } finally {
      setIsSubmitting(false);
      setStatusStep(null);
      setProgressStep(0);
    }
  };

  const handleClaimUnlocked = async (lock: StoredVestingLock) => {
    if (!publicKey || !sendTransaction || !connection) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/vesting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          mint: lock.mint,
          unlockTimestamp: lock.unlockUnix,
          beneficiary: lock.beneficiary,
          wallet: publicKey.toBase58(),
          network: cluster,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to claim unlocked tokens.");
      }

      const txBuf = Buffer.from(data.transaction, "base64");
      const vTx = VersionedTransaction.deserialize(new Uint8Array(txBuf));
      const sig = await sendTransaction(vTx, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: data.blockhash,
          lastValidBlockHeight: data.lastValidBlockHeight,
        },
        "confirmed"
      );

      setNotification({
        type: "success",
        message: isPt
          ? `✓ Tokens resgatados do Escrow (${data.claimedAmountUi}) com sucesso!`
          : `✓ Successfully claimed ${data.claimedAmountUi} tokens from Escrow!`,
        txId: sig,
      });
      refreshTokens();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to claim lock.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMintLocks = async () => {
    const cleanMint = verifyMintInput.trim();
    if (!cleanMint || !isValidPublicKey(cleanMint)) return;
    setIsVerifying(true);
    try {
      const res = await fetch(
        `/api/vesting?mint=${encodeURIComponent(cleanMint)}&network=${cluster}`
      );
      const data = await res.json();
      const onChainList: StoredVestingLock[] = Array.isArray(data.locks)
        ? data.locks.map((l: Record<string, unknown>) => ({
            escrowAddress: String(l.escrowAddress || ""),
            escrowSeed: String(l.escrowSeed || ""),
            mint: String(l.mint || cleanMint),
            symbol: cleanMint.slice(0, 4).toUpperCase(),
            amountUi: String(l.amountUi || "0"),
            unlockUnix: Number(l.unlockUnix || 0),
            beneficiary: String(l.beneficiary || ""),
            signature: String(l.signature || ""),
            network: cluster,
            createdAt: Date.now(),
          }))
        : [];

      const localMatches = myLocks.filter((l) => l.mint === cleanMint);
      const merged = [...onChainList];
      for (const loc of localMatches) {
        if (!merged.some((m) => m.escrowAddress === loc.escrowAddress)) {
          merged.push(loc);
        }
      }
      setVerifiedLocks(merged);
    } catch {
      setVerifiedLocks(myLocks.filter((l) => l.mint === cleanMint));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "0.85rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.28rem 0.65rem",
              borderRadius: "999px",
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              fontSize: "0.76rem",
            }}
          >
            <span>{isPt ? "Rede Ativa:" : "Active Network:"}</span>
            <button
              type="button"
              onClick={() => setCluster("mainnet-beta")}
              style={{
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                background:
                  cluster === "mainnet-beta" ? "rgba(20, 241, 149, 0.16)" : "transparent",
                color: cluster === "mainnet-beta" ? "#14f195" : "hsl(var(--muted-foreground))",
              }}
            >
              ● Mainnet-Beta
            </button>
            <button
              type="button"
              onClick={() => setCluster("devnet")}
              style={{
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                background:
                  cluster === "devnet" ? "rgba(245, 158, 11, 0.16)" : "transparent",
                color: cluster === "devnet" ? "#fbbf24" : "hsl(var(--muted-foreground))",
              }}
            >
              ● Devnet
            </button>
          </div>

          <span
            style={{
              padding: "0.32rem 0.85rem",
              borderRadius: "999px",
              background: "rgba(20, 241, 149, 0.14)",
              border: "1px solid rgba(20, 241, 149, 0.4)",
              color: "#14f195",
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            🔒 {SERVICE_FEE_TOKEN_VESTING_LOCK_SOL.toFixed(2)} SOL · 30% Affiliate (
            {splitInfo.affiliateSol.toFixed(3)} SOL) / 70% Dev ({splitInfo.devWalletSol.toFixed(3)}{" "}
            SOL)
          </span>
        </div>

        <h1 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {isPt
            ? "Cofre de Token Vesting & LP Lock Verificável On-Chain"
            : "Verified On-Chain Token Vesting & LP Lock Vault"}
        </h1>
        <p
          style={{
            maxWidth: "740px",
            margin: "0.6rem auto 0",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.95rem",
          }}
        >
          {isPt
            ? "Tranque qualquer token SPL, Token-2022 ou LP Token (Raydium/Meteora) em uma conta de Escrow determinística on-chain com prova imutável no SPL Memo Program e Certificado PNG exportável."
            : "Lock any SPL, Token-2022, or Raydium/Meteora LP Token in a deterministic on-chain Escrow account with immutable SPL Memo Program proof and an exportable PNG Certificate."}
        </p>

        {/* 3 Required Tabs */}
        <div
          style={{
            display: "inline-flex",
            gap: "0.45rem",
            padding: "0.35rem",
            borderRadius: "999px",
            background: "hsla(var(--muted), 0.7)",
            border: "1px solid hsl(var(--border))",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              border:
                activeTab === "create"
                  ? "1px solid rgba(20, 241, 149, 0.5)"
                  : "1px solid transparent",
              background:
                activeTab === "create" ? "rgba(20, 241, 149, 0.16)" : "transparent",
              color: activeTab === "create" ? "#14f195" : "hsl(var(--muted-foreground))",
            }}
          >
            🔒 {isPt ? "Criar Novo Lock (Team / LP Tokens)" : "Create New Lock (Team / LP Tokens)"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my-locks")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              border:
                activeTab === "my-locks"
                  ? "1px solid rgba(0, 209, 255, 0.5)"
                  : "1px solid transparent",
              background:
                activeTab === "my-locks" ? "rgba(0, 209, 255, 0.16)" : "transparent",
              color: activeTab === "my-locks" ? "#00d1ff" : "hsl(var(--muted-foreground))",
            }}
          >
            📦 {isPt ? "Meus Locks Ativos (Claim após vencimento)" : "My Active Locks (Claim after unlock)"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("verify")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              border:
                activeTab === "verify"
                  ? "1px solid rgba(153, 69, 255, 0.5)"
                  : "1px solid transparent",
              background:
                activeTab === "verify" ? "rgba(153, 69, 255, 0.16)" : "transparent",
              color: activeTab === "verify" ? "#c4b5fd" : "hsl(var(--muted-foreground))",
            }}
          >
            🔍 {isPt ? "Verificar Certificado por Mint" : "Verify Certificate by Mint"}
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div style={{ gridColumn: "span 2" }}>
          {activeTab === "create" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isPt
                    ? `Criar Novo Token Vesting / LP Lock (${cluster})`
                    : `Create New Token Vesting / LP Lock (${cluster})`}
                </CardTitle>
                <CardDescription>
                  {isPt
                    ? "Gera uma conta de Escrow determinística com seed (vest_MINT_TIMESTAMP) e grava o certificado JSON on-chain via Memo Program."
                    : "Creates a deterministic Escrow account with seed (vest_MINT_TIMESTAMP) and records the JSON certificate on-chain via the SPL Memo Program."}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleCreateLock}>
                <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  {notification && (
                    <Notification
                      type={notification.type}
                      message={notification.message}
                      txId={notification.txId}
                      onClose={() => setNotification(null)}
                    />
                  )}

                  <TransactionStatusStepper
                    isActive={isSubmitting}
                    currentStepIndex={progressStep}
                    statusMessage={statusStep}
                    operationTitle={
                      isPt
                        ? `Trancando Tokens On-Chain (${cluster})`
                        : `Locking Tokens On-Chain (${cluster})`
                    }
                  />

                  <div>
                    <Label>
                      {isPt
                        ? "1. Selecione o Token ou LP Token da Carteira"
                        : "1. Select Wallet Token or LP Token"}
                    </Label>
                    <div style={{ marginTop: "0.4rem" }}>
                      <TokenSelector
                        tokens={userTokens}
                        selectedTokenMint={selectedMint}
                        onSelectToken={setSelectedMint}
                        isLoading={isLoadingTokens}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                      gap: "0.85rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Label htmlFor="vestAmount">
                          {isPt ? "2. Quantidade para Trancar" : "2. Amount to Lock"}
                        </Label>
                        {selectedToken && (
                          <button
                            type="button"
                            onClick={() => setAmount(selectedToken.amount)}
                            style={{
                              fontSize: "0.74rem",
                              color: "#14f195",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            MAX ({parseFloat(selectedToken.amount).toLocaleString()})
                          </button>
                        )}
                      </div>
                      <Input
                        id="vestAmount"
                        type="number"
                        step="any"
                        min="0"
                        placeholder="1000000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="unlockDate">
                        {isPt
                          ? "3. Data e Hora de Desbloqueio (Unlock)"
                          : "3. Unlock Date & Time"}
                      </Label>
                      <Input
                        id="unlockDate"
                        type="datetime-local"
                        value={unlockDateStr}
                        onChange={(e) => setUnlockDateStr(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="beneficiaryAddr">
                      {isPt
                        ? "4. Carteira Beneficiária (Opcional — Padrão: Sua Carteira Conectada)"
                        : "4. Beneficiary Wallet (Optional — Default: Connected Wallet)"}
                    </Label>
                    <Input
                      id="beneficiaryAddr"
                      placeholder={publicKey ? publicKey.toBase58() : "Solana Base58 Address"}
                      value={beneficiaryInput}
                      onChange={(e) => setBeneficiaryInput(e.target.value)}
                    />
                  </div>

                  {lastCreatedLock && (
                    <VestingCertificateCanvas
                      lock={lastCreatedLock}
                      explorerUrl={getExplorerUrl("tx", lastCreatedLock.signature)}
                    />
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !selectedMint || !amount || !publicKey}
                  >
                    {isSubmitting
                      ? statusStep || (isPt ? "Trancando..." : "Locking...")
                      : isPt
                      ? `🔒 Criar Contrato de Lock On-Chain (${SERVICE_FEE_TOKEN_VESTING_LOCK_SOL.toFixed(
                          2
                        )} SOL)`
                      : `🔒 Create On-Chain Lock Contract (${SERVICE_FEE_TOKEN_VESTING_LOCK_SOL.toFixed(
                          2
                        )} SOL)`}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === "my-locks" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isPt
                    ? "Meus Locks Ativos & Resgate (Claim)"
                    : "My Active Locks & Post-Unlock Claim"}
                </CardTitle>
                <CardDescription>
                  {isPt
                    ? "Após o vencimento do timestamp, clique em Claim para transferir os tokens de volta e recuperar o rent do Escrow."
                    : "Once the unlock timestamp matures, click Claim to transfer tokens back and recover the Escrow account rent."}
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {myLocks.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center" }}>
                    {isPt
                      ? "Nenhum lock registrado localmente ainda."
                      : "No locks created from this browser yet."}
                  </div>
                ) : (
                  myLocks.map((lock, idx) => {
                    const isMatured = Date.now() / 1000 >= lock.unlockUnix;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "1rem",
                          borderRadius: "0.75rem",
                          border: "1px solid hsl(var(--border))",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.65rem",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: "0.95rem", color: "#14f195" }}>
                              {Number(lock.amountUi).toLocaleString()} ${lock.symbol}
                            </strong>
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontFamily: "monospace",
                                color: "hsl(var(--muted-foreground))",
                              }}
                            >
                              Escrow: {lock.escrowAddress} · Unlock:{" "}
                              {new Date(lock.unlockUnix * 1000).toUTCString()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Button
                              type="button"
                              className="secondary"
                              onClick={() => setLastCreatedLock(lock)}
                            >
                              🏆 Certificado PNG
                            </Button>
                            <Button
                              type="button"
                              disabled={!isMatured || isSubmitting}
                              onClick={() => handleClaimUnlocked(lock)}
                            >
                              {isMatured ? "🔓 Claim Tokens" : "🔒 Locked"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {lastCreatedLock && (
                  <VestingCertificateCanvas
                    lock={lastCreatedLock}
                    explorerUrl={getExplorerUrl("tx", lastCreatedLock.signature)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "verify" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isPt
                    ? "Verificar Certificado de Lock por Mint On-Chain"
                    : "Verify On-Chain Lock Certificate by Mint"}
                </CardTitle>
                <CardDescription>
                  {isPt
                    ? "Inspeciona registros CTS_LOCK diretamente na blockchain via SPL Memo Program."
                    : "Inspects CTS_LOCK records directly on the Solana blockchain via the SPL Memo Program."}
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <Input
                      placeholder="Cole o endereço Mint do Token ou LP..."
                      value={verifyMintInput}
                      onChange={(e) => setVerifyMintInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyMintLocks}
                    disabled={isVerifying || !verifyMintInput.trim()}
                  >
                    {isVerifying
                      ? isPt
                        ? "Buscando On-Chain..."
                        : "Inspecting On-Chain..."
                      : isPt
                      ? "🔍 Verificar On-Chain"
                      : "🔍 Verify On-Chain"}
                  </Button>
                </div>

                {verifiedLocks.length > 0 ? (
                  verifiedLocks.map((lock, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "0.9rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(20, 241, 149, 0.4)",
                        background: "rgba(20, 241, 149, 0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <strong style={{ color: "#14f195" }}>
                          ✓ Lock Verificado: {lock.amountUi} Tokens
                        </strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.78rem",
                            fontFamily: "monospace",
                          }}
                        >
                          Escrow: {lock.escrowAddress} · Unlock:{" "}
                          {new Date(lock.unlockUnix * 1000).toUTCString()}
                        </span>
                      </div>
                      <Link
                        href={`/token/${lock.mint}`}
                        style={{
                          color: "#00d1ff",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          textDecoration: "underline",
                        }}
                      >
                        Página Pública /token/{lock.mint.slice(0, 6)}... ↗
                      </Link>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
                    {isPt
                      ? "Informe um Mint acima para consultar travas on-chain."
                      : "Enter a Mint address above to inspect on-chain locks."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <CostSummary operation="tokenVestingLock" />
        </aside>
      </div>
    </div>
  );
}

export default function VestingPage() {
  return <VestingPageInner />;
}
