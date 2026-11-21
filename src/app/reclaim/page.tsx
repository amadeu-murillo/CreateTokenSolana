"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUserTokens, EmptyTokenAccount } from "@/hooks/useUserTokens";
import { useBurnToken } from "@/hooks/useBurnToken";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Notification from "@/components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import {
  AFFILIATE_COMMISSION_RATE,
  DEV_AFFILIATE_SHARE_RATE,
  ESTIMATED_ATA_RENT_SOL,
  MAX_CLOSE_ACCOUNTS_PER_TX,
  RECLAIM_SOL_SERVICE_FEE_RATE,
} from "@/lib/constants";
import { isValidPublicKey } from "@/lib/security";
import { SITE_URL } from "@/lib/seo";

function ReclaimPageInner() {
  const [queryRef, setQueryRef] = useState<string | null>(null);
  const [storedRef, setStoredRef] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const { locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const {
    emptyAccounts,
    isLoading: isScanning,
    refreshTokens,
  } = useUserTokens();

  const {
    reclaimEmptyAccounts,
    isReclaimingSol,
    statusStep,
    progressStep,
    error,
    reclaimResult,
    reset,
  } = useBurnToken();

  const [activeTab, setActiveTab] = useState<"ata-rent" | "simd-0437">("ata-rent");
  const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>([]);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
    txId?: string | null;
  } | null>(null);
  const [blinkCopied, setBlinkCopied] = useState(false);

  // Capture ?ref= from query string and persist in localStorage (SSR-safe without Suspense bailout)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && isValidPublicKey(ref)) {
        const cleaned = ref.trim();
        setQueryRef(cleaned);
        localStorage.setItem("affiliateRef", cleaned);
      }
      const saved = localStorage.getItem("affiliateRef");
      if (saved && isValidPublicKey(saved)) {
        setStoredRef(saved);
      }
    } catch {
      // Ignore URL parsing or storage errors
    }
  }, []);

  // Auto-select all empty accounts when detected
  useEffect(() => {
    setSelectedPubkeys(emptyAccounts.map((acc) => acc.pubkey));
  }, [emptyAccounts]);

  useEffect(() => {
    if (error) {
      setNotification({ type: "error", message: error });
    }
  }, [error]);

  const selectedAccounts: EmptyTokenAccount[] = useMemo(
    () => emptyAccounts.filter((acc) => selectedPubkeys.includes(acc.pubkey)),
    [emptyAccounts, selectedPubkeys]
  );

  const grossSolSelected = useMemo(
    () =>
      selectedAccounts.reduce(
        (sum, acc) => sum + (acc.rentSol || ESTIMATED_ATA_RENT_SOL),
        0
      ),
    [selectedAccounts]
  );

  const platformFeeSol = grossSolSelected * RECLAIM_SOL_SERVICE_FEE_RATE; // 8%
  const netUserSol = Math.max(0, grossSolSelected - platformFeeSol); // 92%
  const affiliateShareSol = platformFeeSol * AFFILIATE_COMMISSION_RATE; // 30% of 8% = 2.4%
  const devShareSol = platformFeeSol * DEV_AFFILIATE_SHARE_RATE; // 70% of 8% = 5.6%
  const batchCount = Math.ceil(selectedAccounts.length / MAX_CLOSE_ACCOUNTS_PER_TX);

  const toggleAccountSelection = (pubkey: string) => {
    setSelectedPubkeys((prev) =>
      prev.includes(pubkey) ? prev.filter((item) => item !== pubkey) : [...prev, pubkey]
    );
  };

  const handleSelectAll = () => {
    setSelectedPubkeys(emptyAccounts.map((a) => a.pubkey));
  };

  const handleSelectFirstBatch = () => {
    setSelectedPubkeys(
      emptyAccounts.slice(0, MAX_CLOSE_ACCOUNTS_PER_TX).map((a) => a.pubkey)
    );
  };

  const handleClearSelection = () => {
    setSelectedPubkeys([]);
  };

  const handleExecuteReclaim = async () => {
    if (selectedAccounts.length === 0) return;
    setNotification(null);
    reset();

    const res = await reclaimEmptyAccounts(selectedAccounts);
    if (res) {
      setNotification({
        type: "success",
        message: isPt
          ? `✓ ${res.closedAccountsCount} contas vazias fechadas! Você recebeu +${res.netUserSol.toFixed(5)} SOL líquidos (92%).`
          : `✓ Closed ${res.closedAccountsCount} empty ATAs! You received +${res.netUserSol.toFixed(5)} SOL net (92%).`,
        txId: res.signature,
      });
      refreshTokens();
    }
  };

  const activeReferral =
    queryRef ||
    (publicKey ? publicKey.toBase58() : null) ||
    storedRef;
  const referralQuery = activeReferral ? `?ref=${activeReferral}` : "";
  const reclaimBlinkUrl = `${SITE_URL}/reclaim${referralQuery}`;

  const handleCopyReclaimBlink = () => {
    navigator.clipboard?.writeText(reclaimBlinkUrl);
    setBlinkCopied(true);
    setTimeout(() => setBlinkCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "1.5rem 1rem" }}>
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
            💎 {isPt ? "92% Líquido ao Usuário · Apenas 8% Taxa" : "92% Net to User · Only 8% Platform Fee"}
          </span>
        </div>

        <h1 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {isPt
            ? "SOL Rent Recovery — Recuperar SOL de Contas Vazias"
            : "Solana Rent Recovery — Reclaim Locked SOL from Empty Accounts"}
        </h1>
        <p
          style={{
            maxWidth: "740px",
            margin: "0.6rem auto 0",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.96rem",
          }}
        >
          {isPt
            ? "Escaneie automaticamente todas as contas SPL e Token-2022 com saldo zero na sua carteira, feche até 20 ATAs por transação atômica e recupere ~0.00204 SOL por conta (92% líquido direto na sua carteira)."
            : "Automatically scan all zero-balance SPL and Token-2022 accounts in your wallet, batch-close up to 20 empty ATAs per atomic transaction, and recover ~0.00204 SOL per account (92% net directly to your wallet)."}
        </p>

        {/* Mode Switcher: Empty ATA Rent Recovery vs SIMD-0437 WithdrawExcessLamports */}
        <div
          style={{
            display: "inline-flex",
            gap: "0.5rem",
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
            onClick={() => setActiveTab("ata-rent")}
            style={{
              padding: "0.5rem 1.15rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              border:
                activeTab === "ata-rent"
                  ? "1px solid rgba(20, 241, 149, 0.5)"
                  : "1px solid transparent",
              background:
                activeTab === "ata-rent" ? "rgba(20, 241, 149, 0.16)" : "transparent",
              color: activeTab === "ata-rent" ? "#14f195" : "hsl(var(--muted-foreground))",
            }}
          >
            ⚡ {isPt ? "Fechar ATAs Vazias (SPL & Token-2022)" : "Close Empty ATAs (SPL & Token-2022)"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("simd-0437")}
            style={{
              padding: "0.5rem 1.15rem",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              border:
                activeTab === "simd-0437"
                  ? "1px solid rgba(153, 69, 255, 0.5)"
                  : "1px solid transparent",
              background:
                activeTab === "simd-0437" ? "rgba(153, 69, 255, 0.16)" : "transparent",
              color: activeTab === "simd-0437" ? "#c4b5fd" : "hsl(var(--muted-foreground))",
            }}
          >
            🧬 {isPt ? "SIMD-0437 WithdrawExcessLamports (Contas Ativas)" : "SIMD-0437 WithdrawExcessLamports (Active Accounts)"}
          </button>
        </div>
      </header>

      {activeTab === "simd-0437" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              🧬{" "}
              {isPt
                ? "SIMD-0437: Resgate de Excesso de Rent em Contas Ativas (WithdrawExcessLamports)"
                : "SIMD-0437: Active Account Excess Rent Recovery (WithdrawExcessLamports)"}
            </CardTitle>
            <CardDescription>
              {isPt
                ? "Arquitetura preparada para o protocolo SIMD-0437 da Solana, permitindo resgatar lamports excedentes de contas SPL/Token-2022 ativas sem precisar fechar a conta."
                : "Protocol-ready module for Solana SIMD-0437, enabling excess lamport withdrawal from active SPL/Token-2022 accounts without closing the token account."}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "1rem 1.15rem",
                borderRadius: "0.75rem",
                background: "rgba(153, 69, 255, 0.1)",
                border: "1px solid rgba(153, 69, 255, 0.35)",
                fontSize: "0.88rem",
                lineHeight: 1.55,
              }}
            >
              <strong>
                {isPt
                  ? "Status On-Chain do SIMD-0437:"
                  : "SIMD-0437 On-Chain Feature Gate Status:"}
              </strong>{" "}
              {isPt
                ? "Assim que o feature gate de redução de rent exempt mínimo for ativado pelos validadores da Mainnet-Beta, esta aba habilitará automaticamente a instrução nativa WithdrawExcessLamports em lote com a mesma taxa transparente de 8% (92% líquido ao usuário). Enquanto isso, utilize a aba 'Fechar ATAs Vazias' para recuperar 100% do aluguel (~0.00204 SOL/conta) de tokens zerados."
                : "As soon as the minimum rent-exemption reduction feature gate activates on Mainnet-Beta validators, this tab automatically unlocks batched WithdrawExcessLamports instructions with the same 8% fee (92% net to user). Meanwhile, use the 'Close Empty ATAs' tab to recover 100% of locked rent (~0.00204 SOL/account) from zero-balance token accounts."}
            </div>
            <div>
              <Button type="button" onClick={() => setActiveTab("ata-rent")}>
                {isPt
                  ? "← Voltar para Fechamento de ATAs Vazias (Disponível Agora)"
                  : "← Switch to Close Empty ATAs (Live Now)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          <Card style={{ gridColumn: "span 2" }}>
            <CardHeader>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <CardTitle>
                    {isPt
                      ? `Escaneador Não-Custodial de ATAs Vazias (${cluster})`
                      : `Non-Custodial Empty ATA Scanner (${cluster})`}
                  </CardTitle>
                  <CardDescription>
                    {isPt
                      ? "Selecione até 20 contas vazias por lote. Somente contas com saldo exato igual a 0 e não congeladas são elegíveis."
                      : "Select up to 20 empty accounts per transaction batch. Only unlocked accounts with an exact 0 token balance are included."}
                  </CardDescription>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={refreshTokens}
                    disabled={isScanning || isReclaimingSol}
                  >
                    {isScanning
                      ? isPt
                        ? "Escaneando..."
                        : "Scanning..."
                      : isPt
                      ? "🔄 Atualizar Carteira"
                      : "🔄 Rescan Wallet"}
                  </Button>
                  <Button
                    type="button"
                    className="secondary"
                    onClick={handleCopyReclaimBlink}
                  >
                    {blinkCopied ? "✓ Blink Copied!" : "⚡ Copy Reclaim Blink"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
              {notification && (
                <Notification
                  type={notification.type}
                  message={notification.message}
                  txId={notification.txId}
                  onClose={() => {
                    setNotification(null);
                    reset();
                  }}
                />
              )}

              <TransactionStatusStepper
                isActive={isReclaimingSol}
                currentStepIndex={progressStep}
                statusMessage={statusStep}
                operationTitle={
                  isPt
                    ? `Fechando ${selectedAccounts.length} ATAs Vazias (${cluster})`
                    : `Closing ${selectedAccounts.length} Empty ATAs (${cluster})`
                }
              />

              {/* Metrics Breakdown Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderRadius: "0.85rem",
                  background: "hsla(var(--muted), 0.55)",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "ATAs Selecionadas" : "Selected Empty ATAs"}
                  </span>
                  <strong style={{ fontSize: "1.15rem" }}>
                    {selectedAccounts.length} / {emptyAccounts.length}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "SOL Bruto Desbloqueado" : "Gross Locked Rent"}
                  </span>
                  <strong style={{ fontSize: "1.15rem" }}>
                    ~{grossSolSelected.toFixed(5)} SOL
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Taxa Plataforma (8%)" : "Platform Fee (8%)"}
                  </span>
                  <strong style={{ fontSize: "1.15rem", color: "#c4b5fd" }}>
                    ~{platformFeeSol.toFixed(5)} SOL
                  </strong>
                  <span style={{ fontSize: "0.68rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    5.6% Dev ({devShareSol.toFixed(5)}) · 2.4% Aff ({affiliateShareSol.toFixed(5)})
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Líquido para Você (92%)" : "Net to Your Wallet (92%)"}
                  </span>
                  <strong style={{ fontSize: "1.2rem", color: "#14f195" }}>
                    +{netUserSol.toFixed(5)} SOL
                  </strong>
                </div>
              </div>

              {!connected ? (
                <div
                  style={{
                    padding: "2rem 1.25rem",
                    textAlign: "center",
                    borderRadius: "0.85rem",
                    border: "1px dashed rgba(20, 241, 149, 0.45)",
                    background: "rgba(20, 241, 149, 0.05)",
                  }}
                >
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    {isPt
                      ? "Conecte sua carteira Solana para escanear ATAs vazias gratuitamente"
                      : "Connect your Solana wallet to scan empty token accounts for free"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "hsl(var(--muted-foreground))",
                      marginBottom: "1rem",
                    }}
                  >
                    {isPt
                      ? "100% Não-Custodial. Nenhuma conta com saldo de tokens é tocada."
                      : "100% Non-Custodial. Accounts holding positive token balances are never touched."}
                  </p>
                  <Button type="button" onClick={() => setWalletModalVisible(true)}>
                    {isPt ? "🔌 Conectar Carteira & Escanear SOL" : "🔌 Connect Wallet & Scan SOL"}
                  </Button>
                </div>
              ) : emptyAccounts.length === 0 ? (
                <div
                  style={{
                    padding: "1.75rem",
                    textAlign: "center",
                    borderRadius: "0.85rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <strong>
                    {isScanning
                      ? isPt
                        ? "Escaneando contas SPL e Token-2022 na blockchain..."
                        : "Scanning SPL & Token-2022 accounts on-chain..."
                      : isPt
                      ? "✓ Sua carteira está limpa! Nenhuma conta ATA vazia encontrada."
                      : "✓ Your wallet is clean! No zero-balance token accounts found."}
                  </strong>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>
                      {isPt
                        ? `Lotes de transação necessários: ${batchCount} (máx. ${MAX_CLOSE_ACCOUNTS_PER_TX} ATAs/tx)`
                        : `Transaction batches required: ${batchCount} (max ${MAX_CLOSE_ACCOUNTS_PER_TX} ATAs/tx)`}
                    </span>
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "0.45rem",
                          fontSize: "0.76rem",
                          border: "1px solid rgba(20, 241, 149, 0.4)",
                          background: "rgba(20, 241, 149, 0.12)",
                          color: "#14f195",
                          cursor: "pointer",
                        }}
                      >
                        {isPt ? "Selecionar Todas" : "Select All"} ({emptyAccounts.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectFirstBatch}
                        style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "0.45rem",
                          fontSize: "0.76rem",
                          border: "1px solid hsl(var(--border))",
                          background: "transparent",
                          color: "#f8fafc",
                          cursor: "pointer",
                        }}
                      >
                        {isPt ? "Top 20 (1 Tx)" : "First 20 (1 Tx)"}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "0.45rem",
                          fontSize: "0.76rem",
                          border: "1px solid hsl(var(--border))",
                          background: "transparent",
                          color: "hsl(var(--muted-foreground))",
                          cursor: "pointer",
                        }}
                      >
                        {isPt ? "Limpar" : "Clear"}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: "320px",
                      overflowY: "auto",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      padding: "0.5rem",
                      display: "grid",
                      gap: "0.4rem",
                    }}
                  >
                    {emptyAccounts.map((acc) => {
                      const isChecked = selectedPubkeys.includes(acc.pubkey);
                      return (
                        <label
                          key={acc.pubkey}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "0.55rem",
                            background: isChecked
                              ? "rgba(20, 241, 149, 0.08)"
                              : "rgba(255, 255, 255, 0.02)",
                            border: isChecked
                              ? "1px solid rgba(20, 241, 149, 0.35)"
                              : "1px solid transparent",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAccountSelection(acc.pubkey)}
                            />
                            <span style={{ fontFamily: "monospace" }}>
                              ATA: {acc.pubkey.slice(0, 6)}...{acc.pubkey.slice(-4)} · Mint:{" "}
                              {acc.mint.slice(0, 6)}...{acc.mint.slice(-4)}
                            </span>
                          </div>
                          <strong style={{ color: "#14f195", fontFamily: "monospace" }}>
                            +{acc.rentSol.toFixed(5)} SOL
                          </strong>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {reclaimResult && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(20, 241, 149, 0.12)",
                    border: "1px solid rgba(20, 241, 149, 0.45)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <strong style={{ color: "#14f195", display: "block" }}>
                      ✓ {reclaimResult.closedAccountsCount} ATAs Fechadas (+
                      {reclaimResult.netUserSol.toFixed(5)} SOL Líquidos)
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                      {isPt
                        ? "Quer usar seu SOL recuperado para lançar um token blindado ou impulsionar volume?"
                        : "Want to put your reclaimed SOL to work launching a token or boosting DexScreener makers?"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={getExplorerUrl("tx", reclaimResult.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(20, 241, 149, 0.5)",
                        color: "#14f195",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                      }}
                    >
                      Solscan TX ↗
                    </a>
                    <Link
                      href={`/${referralQuery}`}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "0.5rem",
                        background: "#14f195",
                        color: "#09090b",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                      }}
                    >
                      {isPt ? "🚀 Criar Token (0.10 SOL)" : "🚀 Launch Token (0.10 SOL)"}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                onClick={handleExecuteReclaim}
                disabled={
                  !connected ||
                  isReclaimingSol ||
                  isScanning ||
                  selectedAccounts.length === 0
                }
                className="w-full"
              >
                {isReclaimingSol
                  ? statusStep || (isPt ? "Recuperando SOL..." : "Reclaiming SOL...")
                  : selectedAccounts.length > 0
                  ? isPt
                    ? `⚡ Fechar ${selectedAccounts.length} Contas & Receber +${netUserSol.toFixed(4)} SOL (92% Líquido)`
                    : `⚡ Close ${selectedAccounts.length} Empty Accounts & Claim +${netUserSol.toFixed(4)} SOL (92% Net)`
                  : isPt
                  ? "Selecione Contas Vazias para Recuperar SOL"
                  : "Select Empty Accounts to Reclaim SOL"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {isPt ? "Transparência On-Chain & Afiliados" : "On-Chain Transparency & Affiliates"}
              </CardTitle>
              <CardDescription>
                {isPt
                  ? "Divisão atômica na mesma transação principal via SystemProgram.transfer."
                  : "Atomic split inside the same main transaction via SystemProgram.transfer."}
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.84rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{isPt ? "Restituição Líquida ao Usuário:" : "Net Returned to User:"}</span>
                <strong style={{ color: "#14f195" }}>92.0%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{isPt ? "Taxa Total da Plataforma:" : "Total Platform Fee:"}</span>
                <strong>8.0%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{isPt ? "Split Dev Wallet (70% da taxa):" : "Dev Wallet Split (70% of fee):"}</span>
                <strong style={{ color: "#c4b5fd" }}>5.6% do rent</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{isPt ? "Split Afiliado ?ref= (30% da taxa):" : "Affiliate ?ref= Split (30% of fee):"}</span>
                <strong style={{ color: "#14f195" }}>2.4% do rent</strong>
              </div>
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.8rem",
                  borderRadius: "0.65rem",
                  background: "rgba(153, 69, 255, 0.1)",
                  border: "1px solid rgba(153, 69, 255, 0.3)",
                }}
              >
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>
                  ⚡ Solana Blink Nativo (/reclaim)
                </strong>
                <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                  {isPt
                    ? "Compartilhe a URL /reclaim?ref=SUA_CARTEIRA no X/Twitter para que qualquer trader feche ATAs vazias direto no feed pagando 30% de comissão para você!"
                    : "Share /reclaim?ref=YOUR_WALLET on X/Twitter so any trader can close empty ATAs directly in-feed while paying you a 30% instant affiliate commission!"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ReclaimPage() {
  return <ReclaimPageInner />;
}
