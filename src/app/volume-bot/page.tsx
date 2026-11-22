"use client";
import { captureAffiliateRef, getStoredAffiliateRef } from "@/lib/affiliateAttribution";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUserTokens } from "@/hooks/useUserTokens";
import { TokenSelector } from "@/components/TokenSelector";
import CostSummary, { Operation } from "@/components/CostSummary";
import Notification from "@/components/ui/Notification";
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
import { isValidPublicKey, verifyTransactionIntegrity } from "@/lib/security";
import {
  EphemeralVolumeWallet,
  VOLUME_BOT_PACKAGES,
  VolumeBotTierId,
  downloadVolumeKeysBackupJson,
  executeSubWalletMakerCycle,
  generateVolumeBotSubWallets,
  sweepAllSubWalletsToMainWallet,
} from "@/lib/services/volumeBotService";
import { computeSplit } from "@/config/pricing";

interface MakerLogEntry {
  id: string;
  makerNumber: number;
  walletIndex: number;
  walletAddress: string;
  signature: string;
  amountSol: number;
  timestamp: string;
}

function VolumeBotPageInner() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { cluster, setCluster, getExplorerUrl } = useCluster();
  const { locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  const { tokens: userTokens, isLoading: isLoadingTokens, refreshTokens } = useUserTokens();

  const [selectedMint, setSelectedMint] = useState<string>("");
  const [customMintInput, setCustomMintInput] = useState<string>("");
  const [tierId, setTierId] = useState<VolumeBotTierId>("starter100");
  const [workingCapitalSol, setWorkingCapitalSol] = useState<string>("0.25");
  const [intervalSec, setIntervalSec] = useState<number>(8);
  const [solPriceUsd] = useState<number>(195);

  const [subWallets, setSubWallets] = useState<EphemeralVolumeWallet[]>([]);
  const [subWalletBalances, setSubWalletBalances] = useState<Record<string, number>>({});
  const [keysBackedUp, setKeysBackedUp] = useState<boolean>(false);
  const [backupFilename, setBackupFilename] = useState<string | null>(null);

  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isLoopRunning, setIsLoopRunning] = useState<boolean>(false);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [completedMakers, setCompletedMakers] = useState<number>(0);
  const [logs, setLogs] = useState<MakerLogEntry[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
    txId?: string | null;
  } | null>(null);

  const stopLoopRef = useRef<boolean>(false);
  const fileRestoreRef = useRef<HTMLInputElement | null>(null);

  // Capture ?ref= and ?mint= (SSR-safe without Suspense bailout)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && isValidPublicKey(ref)) {
        captureAffiliateRef(ref.trim());
      }
      const mintParam = params.get("mint");
      if (mintParam && isValidPublicKey(mintParam)) {
        setSelectedMint(mintParam.trim());
        setCustomMintInput(mintParam.trim());
      }
    } catch {
      // Ignore
    }
  }, []);

  const activePackage = VOLUME_BOT_PACKAGES[tierId];
  const activeMint = (customMintInput.trim() || selectedMint).trim();
  const selectedTokenObj = useMemo(
    () => userTokens.find((tk) => tk.mint === activeMint) || null,
    [userTokens, activeMint]
  );

  // Generate ephemeral sub-wallets when package changes (if not running)
  useEffect(() => {
    if (isLoopRunning) return;
    const generated = generateVolumeBotSubWallets(activePackage.subWalletCount);
    setSubWallets(generated);
    setWorkingCapitalSol(String(activePackage.recommendedWorkingCapitalSol));
    setKeysBackedUp(false);
    setBackupFilename(null);
  }, [tierId, activePackage.subWalletCount, activePackage.recommendedWorkingCapitalSol, isLoopRunning]);

  // Refresh sub-wallet SOL balances
  const refreshSubWalletBalances = async () => {
    if (!connection || subWallets.length === 0) return;
    try {
      const pubkeys = subWallets.map((w) => new PublicKey(w.publicKey));
      const infos = await connection.getMultipleAccountsInfo(pubkeys, "confirmed");
      const nextBalances: Record<string, number> = {};
      infos.forEach((info, idx) => {
        const addr = subWallets[idx]?.publicKey;
        if (addr) {
          nextBalances[addr] = (info?.lamports || 0) / LAMPORTS_PER_SOL;
        }
      });
      setSubWalletBalances(nextBalances);
    } catch {
      // Ignore RPC rate-limit
    }
  };

  useEffect(() => {
    refreshSubWalletBalances();
  }, [subWallets, connection, completedMakers]);

  const numericCapitalSol = Math.max(0.02, parseFloat(workingCapitalSol) || 0.25);
  const perCycleSol = Number(
    Math.max(0.005, (numericCapitalSol / activePackage.subWalletCount) * 0.65).toFixed(4)
  );
  const estimatedVolumeSol = Number(
    (activePackage.makersCount * perCycleSol * 2).toFixed(2)
  );
  const estimatedVolumeUsd = Math.round(estimatedVolumeSol * solPriceUsd);
  const splitInfo = computeSplit(activePackage.serviceFeeSol);

  const handleDownloadBackupKeys = () => {
    if (subWallets.length === 0) return;
    const fname = downloadVolumeKeysBackupJson({
      tierId,
      tokenMint: activeMint || "UNSPECIFIED_MINT",
      network: cluster,
      wallets: subWallets,
    });
    setBackupFilename(fname);
    setKeysBackedUp(true);
  };

  const handleImportSavedJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(parsed.wallets) && parsed.wallets.length > 0) {
          setSubWallets(parsed.wallets);
          setKeysBackedUp(true);
          if (parsed.tokenMint && isValidPublicKey(parsed.tokenMint)) {
            setCustomMintInput(parsed.tokenMint);
            setSelectedMint(parsed.tokenMint);
          }
          setNotification({
            type: "success",
            message: isPt
              ? `✓ ${parsed.wallets.length} sub-carteiras restauradas do backup .JSON com sucesso!`
              : `✓ Restored ${parsed.wallets.length} sub-wallets from .JSON backup!`,
          });
        }
      } catch {
        setNotification({
          type: "error",
          message: "Arquivo .JSON de backup inválido.",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleActivateAndStartLoop = async () => {
    if (!publicKey || !sendTransaction || !connection) {
      setNotification({
        type: "error",
        message: isPt
          ? "Conecte sua carteira Solana antes de ativar o Volume Bot."
          : "Please connect your Solana wallet before activating the Volume Bot.",
      });
      return;
    }

    if (!activeMint || !isValidPublicKey(activeMint)) {
      setNotification({
        type: "error",
        message: isPt
          ? "Selecione ou informe um endereço Mint válido de token."
          : "Please select or enter a valid Token Mint address.",
      });
      return;
    }

    if (!keysBackedUp) {
      setNotification({
        type: "error",
        message: isPt
          ? "Baixe o arquivo .JSON de backup das sub-carteiras antes de iniciar."
          : "Download the sub-wallet keys .JSON backup file before starting.",
      });
      return;
    }

    setIsActivating(true);
    setNotification(null);
    setStatusBanner(
      isPt
        ? "Passo 2/4: Construindo transação atômica de ativação (Taxa + Split 30%/70% + Distribuição de Capital)..."
        : "Step 2/4: Building atomic activation transaction (Fee + 30%/70% Split + Working Capital Distribution)..."
    );

    try {
      const affiliateRef =
        typeof window !== "undefined" ? getStoredAffiliateRef() : null;

      const res = await fetch("/api/volume-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          tierId,
          workingCapitalSol: numericCapitalSol,
          subWallets: subWallets.map((w) => w.publicKey),
          affiliate: affiliateRef,
          network: cluster,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to build Volume Bot activation transaction.");
      }

      const txBuf = Buffer.from(data.transaction, "base64");
      const vTx = VersionedTransaction.deserialize(new Uint8Array(txBuf));

      const integrity = verifyTransactionIntegrity(vTx, publicKey.toBase58());
      if (!integrity.valid) {
        throw new Error(integrity.reason || "Security verification failed.");
      }

      setStatusBanner(
        isPt
          ? "Assine a transação de ativação na sua carteira..."
          : "Approve the activation transaction in your wallet..."
      );

      const activationSig = await sendTransaction(vTx, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(
        {
          signature: activationSig,
          blockhash: data.blockhash,
          lastValidBlockHeight: data.lastValidBlockHeight,
        },
        "confirmed"
      );

      setNotification({
        type: "success",
        message: isPt
          ? `✓ Pacote ${activePackage.makersCount} Makers ativado! Iniciando ciclo não-custodial...`
          : `✓ ${activePackage.makersCount} Makers package activated! Starting non-custodial maker loop...`,
        txId: activationSig,
      });

      await refreshSubWalletBalances();
      setIsActivating(false);

      // Step 3: Client-side Non-Custodial Maker Loop
      stopLoopRef.current = false;
      setIsLoopRunning(true);
      setCompletedMakers(0);

      const mintPubkey = new PublicKey(activeMint);
      const tokenProgId =
        selectedTokenObj?.programId === TOKEN_2022_PROGRAM_ID.toBase58()
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID;
      const tradeLamports = Math.max(
        150_000,
        Math.round(perCycleSol * LAMPORTS_PER_SOL * 0.5)
      );

      for (let m = 1; m <= activePackage.makersCount; m++) {
        if (stopLoopRef.current) break;
        const walletItem = subWallets[(m - 1) % subWallets.length];
        const subKp = Keypair.fromSecretKey(Uint8Array.from(walletItem.secretKeyArray));

        setStatusBanner(
          isPt
            ? `Passo 3/4: Executando Maker #${m}/${activePackage.makersCount} via Sub-Carteira #${walletItem.index}...`
            : `Step 3/4: Executing Maker #${m}/${activePackage.makersCount} via Sub-Wallet #${walletItem.index}...`
        );

        try {
          const cycleRes = await executeSubWalletMakerCycle({
            connection,
            cluster,
            subWalletKeypair: subKp,
            tokenMint: mintPubkey,
            tokenProgramId: tokenProgId,
            tradeAmountLamports: tradeLamports,
          });

          setCompletedMakers(m);
          setLogs((prev) => [
            {
              id: `${Date.now()}-${m}`,
              makerNumber: m,
              walletIndex: walletItem.index,
              walletAddress: walletItem.publicKey,
              signature: cycleRes.signature,
              amountSol: Number((tradeLamports / LAMPORTS_PER_SOL).toFixed(4)),
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 99),
          ]);
        } catch (cycleErr) {
          console.warn(`Maker #${m} cycle warning:`, cycleErr);
        }

        if (m < activePackage.makersCount && !stopLoopRef.current) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.max(2, intervalSec) * 1000)
          );
        }
      }

      setIsLoopRunning(false);

      // Step 4: Automatic Sweep All SOL Back at end of cycle
      setStatusBanner(
        isPt
          ? "Passo 4/4: Ciclo concluído! Fechando ATAs temporárias e devolvendo SOL para a carteira principal..."
          : "Step 4/4: Cycle finished! Closing temporary ATAs and sweeping all SOL back to main wallet..."
      );
      await handleEmergencySweep();
    } catch (err) {
      setIsActivating(false);
      setIsLoopRunning(false);
      setNotification({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Falha ao executar o Volume & Maker Booster.",
      });
    }
  };

  const handleStopLoop = () => {
    stopLoopRef.current = true;
    setIsLoopRunning(false);
    setStatusBanner(
      isPt
        ? "Ciclo pausado pelo usuário. Use o botão Sweep para recolher todo o SOL remanescente."
        : "Maker loop paused by user. Click Sweep to recover all remaining SOL to your main wallet."
    );
  };

  const handleEmergencySweep = async () => {
    if (!publicKey || !connection || subWallets.length === 0) return;
    stopLoopRef.current = true;
    setIsLoopRunning(false);
    setIsSweeping(true);

    try {
      const sweepRes = await sweepAllSubWalletsToMainWallet({
        connection,
        mainWalletPubkey: publicKey,
        subWallets,
        onProgress: (msg) => setStatusBanner(msg),
      });

      await refreshSubWalletBalances();
      refreshTokens();

      setNotification({
        type: "success",
        message: isPt
          ? `✓ Sweep concluído! ${sweepRes.sweptCount} sub-carteiras varridas (+${sweepRes.totalRecoveredSol.toFixed(
              5
            )} SOL devolvidos à carteira principal).`
          : `✓ Sweep complete! Swept ${sweepRes.sweptCount} sub-wallets (+${sweepRes.totalRecoveredSol.toFixed(
              5
            )} SOL returned to main wallet).`,
        txId: sweepRes.signatures[0] || null,
      });
      setStatusBanner(null);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to sweep sub-wallets.",
      });
    } finally {
      setIsSweeping(false);
    }
  };

  const costSummaryOp: Operation =
    tierId === "trending750"
      ? "volumeBotTrending"
      : tierId === "growth300"
      ? "volumeBotGrowth"
      : "volumeBotStarter";

  const totalSubWalletSol = Object.values(subWalletBalances).reduce(
    (acc, v) => acc + v,
    0
  );

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "1.5rem 1rem" }}>
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
              background: "rgba(153, 69, 255, 0.16)",
              border: "1px solid rgba(153, 69, 255, 0.45)",
              color: "#c4b5fd",
              fontSize: "0.78rem",
              fontWeight: 800,
            }}
          >
            📈 100% Non-Custodial · DexScreener Makers & Volume Booster
          </span>
        </div>

        <h1 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {isPt
            ? "Volume & Maker Booster Bot Não-Custodial"
            : "Non-Custodial Solana Volume & Maker Booster Bot"}
        </h1>
        <p
          style={{
            maxWidth: "760px",
            margin: "0.6rem auto 0",
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.95rem",
          }}
        >
          {isPt
            ? "Gere centenas de makers únicos on-chain e volume orgânico no DexScreener usando carteiras efêmeras geradas no seu navegador, com backup .JSON obrigatório e devolução automática de 100% do SOL e rent de ATAs ao final."
            : "Generate hundreds of unique on-chain makers and organic DexScreener volume using browser-generated ephemeral sub-wallets, mandatory .JSON key backup, and automatic 100% SOL + ATA rent sweep back to your main wallet."}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
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
                      ? `Configurar Ciclo de Makers & Volume (${cluster})`
                      : `Configure Makers & Volume Booster (${cluster})`}
                  </CardTitle>
                  <CardDescription>
                    {isPt
                      ? `Split atômico de 30% Afiliado (${splitInfo.affiliateSol.toFixed(
                          3
                        )} SOL) / 70% Dev (${splitInfo.devWalletSol.toFixed(3)} SOL).`
                      : `Atomic 30% Affiliate (${splitInfo.affiliateSol.toFixed(
                          3
                        )} SOL) / 70% Dev (${splitInfo.devWalletSol.toFixed(3)} SOL) split.`}
                  </CardDescription>
                </div>

                {/* Emergency Sweep Button */}
                <Button
                  type="button"
                  onClick={handleEmergencySweep}
                  disabled={isSweeping || !publicKey || subWallets.length === 0}
                  style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                  }}
                >
                  {isSweeping
                    ? isPt
                      ? "Varrendo SOL..."
                      : "Sweeping SOL..."
                    : "🚨 Recover & Sweep All SOL to Main Wallet"}
                </Button>
              </div>
            </CardHeader>

            <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
              {notification && (
                <Notification
                  type={notification.type}
                  message={notification.message}
                  txId={notification.txId}
                  onClose={() => setNotification(null)}
                />
              )}

              {statusBanner && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(20, 241, 149, 0.12)",
                    border: "1px solid rgba(20, 241, 149, 0.45)",
                    color: "#14f195",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                  }}
                >
                  ⚡ {statusBanner}
                </div>
              )}

              {/* Step 1: Select Token Mint */}
              <div>
                <Label>
                  {isPt
                    ? "1. Selecione o Token da Carteira ou Cole o Mint Address"
                    : "1. Select Wallet Token or Paste Token Mint Address"}
                </Label>
                <div style={{ marginTop: "0.4rem" }}>
                  <TokenSelector
                    tokens={userTokens}
                    selectedTokenMint={selectedMint}
                    onSelectToken={(mint) => {
                      setSelectedMint(mint);
                      setCustomMintInput(mint);
                    }}
                    isLoading={isLoadingTokens}
                    disabled={isLoopRunning}
                    autoSelectFirst={false}
                  />
                </div>
                <div style={{ marginTop: "0.55rem" }}>
                  <Input
                    placeholder={
                      isPt
                        ? "Ou cole qualquer endereço Mint SPL / Token-2022..."
                        : "Or paste any SPL / Token-2022 Mint address..."
                    }
                    value={customMintInput}
                    onChange={(e) => setCustomMintInput(e.target.value)}
                    disabled={isLoopRunning}
                  />
                </div>
              </div>

              {/* Step 2: Choose Package */}
              <div>
                <Label>
                  {isPt
                    ? "2. Escolha o Pacote de Makers & Volume"
                    : "2. Select Makers & Volume Package"}
                </Label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.45rem",
                  }}
                >
                  {(Object.values(VOLUME_BOT_PACKAGES) as Array<
                    (typeof VOLUME_BOT_PACKAGES)[VolumeBotTierId]
                  >).map((pkg) => {
                    const isSelected = pkg.id === tierId;
                    const sp = computeSplit(pkg.serviceFeeSol);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        disabled={isLoopRunning}
                        onClick={() => setTierId(pkg.id)}
                        style={{
                          padding: "0.95rem",
                          borderRadius: "0.8rem",
                          textAlign: "left",
                          cursor: "pointer",
                          border: isSelected
                            ? "2px solid #14f195"
                            : "1px solid hsl(var(--border))",
                          background: isSelected
                            ? "rgba(20, 241, 149, 0.12)"
                            : "rgba(255, 255, 255, 0.02)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.3rem",
                          }}
                        >
                          <strong style={{ fontSize: "0.92rem", color: isSelected ? "#14f195" : "#ffffff" }}>
                            {pkg.makersCount} Makers
                          </strong>
                          <span
                            style={{
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              background: "rgba(153, 69, 255, 0.2)",
                              color: "#c4b5fd",
                            }}
                          >
                            {pkg.serviceFeeSol.toFixed(2)} SOL
                          </span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                          {isPt ? pkg.labelPt : pkg.labelEn}
                        </p>
                        <span
                          style={{
                            display: "block",
                            marginTop: "0.35rem",
                            fontSize: "0.68rem",
                            fontFamily: "monospace",
                            color: "#94a3b8",
                          }}
                        >
                          Aff 30%: {sp.affiliateSol.toFixed(3)} · Dev 70%: {sp.devWalletSol.toFixed(3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Working Capital & Interval */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                <div>
                  <Label>
                    {isPt
                      ? "Capital de Giro Temporário (SOL — 100% Recuperável)"
                      : "Temporary Working Capital (SOL — 100% Swept Back)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={workingCapitalSol}
                    onChange={(e) => setWorkingCapitalSol(e.target.value)}
                    disabled={isLoopRunning}
                  />
                </div>
                <div>
                  <Label>
                    {isPt
                      ? "Intervalo entre Makers (5 a 25 segundos)"
                      : "Interval Between Makers (5 to 25 seconds)"}
                  </Label>
                  <Input
                    type="number"
                    min={3}
                    max={60}
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value) || 8)}
                    disabled={isLoopRunning}
                  />
                </div>
              </div>

              {/* Volume Estimator Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "0.75rem",
                  padding: "0.95rem",
                  borderRadius: "0.8rem",
                  background: "hsla(var(--muted), 0.55)",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Makers Únicos Alvo" : "Target Unique Makers"}
                  </span>
                  <strong style={{ fontSize: "1.1rem", color: "#14f195" }}>
                    {completedMakers} / {activePackage.makersCount}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Volume Estimado (SOL)" : "Estimated Volume (SOL)"}
                  </span>
                  <strong style={{ fontSize: "1.1rem" }}>~{estimatedVolumeSol} SOL</strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Volume Estimado (USD)" : "Estimated Volume (USD)"}
                  </span>
                  <strong style={{ fontSize: "1.1rem", color: "#00d1ff" }}>
                    ~${estimatedVolumeUsd.toLocaleString("en-US")}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.74rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Saldo nas Sub-Carteiras" : "Sub-Wallets Balance"}
                  </span>
                  <strong style={{ fontSize: "1.1rem", color: "#c4b5fd" }}>
                    {totalSubWalletSol.toFixed(4)} SOL
                  </strong>
                </div>
              </div>

              {/* Mandatory Step 1 Key Backup Panel */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.8rem",
                  border: keysBackedUp
                    ? "1px solid rgba(20, 241, 149, 0.45)"
                    : "1px solid rgba(245, 158, 11, 0.5)",
                  background: keysBackedUp
                    ? "rgba(20, 241, 149, 0.06)"
                    : "rgba(245, 158, 11, 0.08)",
                }}
              >
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
                    <strong style={{ fontSize: "0.88rem", color: keysBackedUp ? "#14f195" : "#fbbf24" }}>
                      {keysBackedUp
                        ? `✓ Backup Salvo (${backupFilename || "JSON Verificado"})`
                        : isPt
                        ? "⚠️ Passo Obrigatório de Segurança Não-Custodial: Baixe as Chaves Efêmeras (.JSON)"
                        : "⚠️ Mandatory Non-Custodial Safety Step: Download Ephemeral Keys (.JSON)"}
                    </strong>
                    <p style={{ fontSize: "0.76rem", color: "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>
                      {isPt
                        ? `Geramos ${subWallets.length} sub-carteiras efêmeras no navegador. Baixe o arquivo .JSON antes de ativar para garantia total dos seus fundos.`
                        : `Generated ${subWallets.length} ephemeral sub-wallets in your browser. Download the .JSON backup before activating to guarantee 100% fund recovery.`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Button type="button" onClick={handleDownloadBackupKeys}>
                      {keysBackedUp
                        ? "⬇️ Baixar Backup .JSON Novamente"
                        : "⬇️ Baixar createtokensol-volume-keys.json"}
                    </Button>
                    <Button
                      type="button"
                      className="secondary"
                      onClick={() => fileRestoreRef.current?.click()}
                    >
                      📂 Importar Backup .JSON
                    </Button>
                    <input
                      ref={fileRestoreRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportSavedJson}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>

                {/* Sub-Wallets Live Balance Grid */}
                <div
                  style={{
                    marginTop: "0.75rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                    gap: "0.4rem",
                    fontSize: "0.74rem",
                    fontFamily: "monospace",
                  }}
                >
                  {subWallets.map((sw) => (
                    <div
                      key={sw.publicKey}
                      style={{
                        padding: "0.4rem 0.6rem",
                        borderRadius: "0.45rem",
                        background: "rgba(9, 9, 11, 0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        #{sw.index} {sw.publicKey.slice(0, 5)}...{sw.publicKey.slice(-4)}
                      </span>
                      <strong style={{ color: "#14f195" }}>
                        {(subWalletBalances[sw.publicKey] || 0).toFixed(4)} SOL
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {isLoopRunning ? (
                <Button
                  type="button"
                  onClick={handleStopLoop}
                  className="secondary"
                  style={{ flex: 1 }}
                >
                  ⏹ {isPt ? "Pausar Ciclo de Makers" : "Pause Maker Loop"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleActivateAndStartLoop}
                  disabled={
                    isActivating ||
                    isSweeping ||
                    !keysBackedUp ||
                    !activeMint ||
                    !publicKey
                  }
                  style={{ flex: 1 }}
                >
                  {isActivating
                    ? isPt
                      ? "Ativando Pacote..."
                      : "Activating Package..."
                    : !keysBackedUp
                    ? isPt
                      ? "⬇️ Baixe o Backup .JSON Acima para Habilitar"
                      : "⬇️ Download .JSON Key Backup Above to Enable"
                    : isPt
                    ? `🚀 Ativar ${activePackage.makersCount} Makers & Iniciar Volume (${activePackage.serviceFeeSol.toFixed(
                        2
                      )} SOL Taxa + ${numericCapitalSol.toFixed(2)} SOL Giro)`
                    : `🚀 Activate ${activePackage.makersCount} Makers & Start Volume (${activePackage.serviceFeeSol.toFixed(
                        2
                      )} SOL Fee + ${numericCapitalSol.toFixed(2)} SOL Capital)`}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Real-Time Maker Transactions Log */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isPt
                  ? "Log em Tempo Real de Transações & Makers Assinados"
                  : "Real-Time Signed Maker Transactions Log"}
              </CardTitle>
              <CardDescription>
                {isPt
                  ? "Cada linha representa uma execução real verificável no Solscan."
                  : "Every entry represents a real on-chain transaction verifiable on Solscan."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "hsl(var(--muted-foreground))",
                    fontSize: "0.85rem",
                  }}
                >
                  {isPt
                    ? "Nenhuma transação de maker disparada ainda nesta sessão."
                    : "No maker transactions broadcast in this session yet."}
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: "280px",
                    overflowY: "auto",
                    display: "grid",
                    gap: "0.45rem",
                  }}
                >
                  {logs.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: "0.55rem 0.8rem",
                        borderRadius: "0.55rem",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid hsl(var(--border))",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        fontSize: "0.8rem",
                        fontFamily: "monospace",
                      }}
                    >
                      <span>
                        <strong>Maker #{entry.makerNumber}</strong> · Wallet #{entry.walletIndex} (
                        {entry.walletAddress.slice(0, 5)}...{entry.walletAddress.slice(-4)}) ·{" "}
                        {entry.amountSol} SOL · {entry.timestamp}
                      </span>
                      <a
                        href={getExplorerUrl("tx", entry.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#14f195", textDecoration: "underline", fontWeight: 700 }}
                      >
                        Solscan TX ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <CostSummary operation={costSummaryOp} />
        </aside>
      </div>
    </div>
  );
}

export default function VolumeBotPage() {
  return <VolumeBotPageInner />;
}
