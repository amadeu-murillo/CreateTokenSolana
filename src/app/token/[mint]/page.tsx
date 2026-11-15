"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";

interface OnChainTokenDossier {
  mint: string;
  decimals: number;
  supplyUi: number;
  standard: "SPL" | "Token-2022";
  programId: string;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  rugCheckScore: number;
  name?: string;
  symbol?: string;
  imageUrl?: string;
}

export default function PublicTokenPage() {
  const params = useParams<{ mint: string }>();
  const mintParam = typeof params?.mint === "string" ? params.mint : "";
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster, getExplorerUrl } = useCluster();
  const langCtx = useLanguage();
  const locale = langCtx?.locale || "en";
  const isPt = locale === "pt" || locale === "pt-BR";

  const [tokenInfo, setTokenInfo] = useState<OnChainTokenDossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const inspectToken = async () => {
      if (!mintParam || !connection) return;
      setIsLoading(true);
      setError(null);

      try {
        const mintPubkey = new PublicKey(mintParam);
        const acc = await connection.getAccountInfo(mintPubkey, "confirmed");
        if (!acc) {
          throw new Error(
            isPt
              ? `Contrato Mint não encontrado na rede ${cluster}.`
              : `Token Mint account not found on ${cluster}.`
          );
        }

        const is2022 = acc.owner.equals(TOKEN_2022_PROGRAM_ID);
        const progId = is2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
        const mintData = await getMint(connection, mintPubkey, "confirmed", progId);

        const mintRevoked = !mintData.mintAuthority;
        const freezeRevoked = !mintData.freezeAuthority;
        const score = (freezeRevoked ? 50 : 0) + (mintRevoked ? 35 : 0) + 15;
        const supplyUi = Number(mintData.supply) / Math.pow(10, mintData.decimals);

        let cachedName: string | undefined;
        let cachedSymbol: string | undefined;
        let cachedImage: string | undefined;

        try {
          const rawDossier = localStorage.getItem("lastCreatedTokenDossier");
          if (rawDossier) {
            const parsed = JSON.parse(rawDossier);
            if (parsed.mintAddress === mintParam) {
              cachedName = parsed.name;
              cachedSymbol = parsed.symbol;
              cachedImage = parsed.imageUrl;
            }
          }
        } catch {
          // Ignore storage read errors
        }

        if (active) {
          setTokenInfo({
            mint: mintParam,
            decimals: mintData.decimals,
            supplyUi,
            standard: is2022 ? "Token-2022" : "SPL",
            programId: progId.toBase58(),
            mintAuthorityRevoked: mintRevoked,
            freezeAuthorityRevoked: freezeRevoked,
            rugCheckScore: score,
            name: cachedName,
            symbol: cachedSymbol,
            imageUrl: cachedImage,
          });
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to inspect token mint.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    inspectToken();
    return () => {
      active = false;
    };
  }, [mintParam, connection, cluster, isPt]);

  const handleCopyMint = () => {
    if (!mintParam) return;
    navigator.clipboard?.writeText(mintParam);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralSuffix = publicKey ? `?ref=${publicKey.toBase58()}` : "";

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              {tokenInfo?.imageUrl && (
                <img
                  src={tokenInfo.imageUrl}
                  alt={tokenInfo.name || "Token"}
                  style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #14f195" }}
                />
              )}
              <div>
                <CardTitle>
                  {tokenInfo?.name
                    ? `${tokenInfo.name} ($${tokenInfo.symbol})`
                    : `Solana Asset (${mintParam.slice(0, 6)}...${mintParam.slice(-4)})`}
                </CardTitle>
                <CardDescription>
                  {isPt
                    ? `Página Pública & Auditoria On-Chain Verificada (${cluster})`
                    : `Verified On-Chain Public Token Profile & Security Audit (${cluster})`}
                </CardDescription>
              </div>
            </div>

            {tokenInfo && (
              <span
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  background:
                    tokenInfo.rugCheckScore === 100
                      ? "rgba(20, 241, 149, 0.16)"
                      : "rgba(245, 158, 11, 0.18)",
                  border:
                    tokenInfo.rugCheckScore === 100
                      ? "1px solid rgba(20, 241, 149, 0.45)"
                      : "1px solid rgba(245, 158, 11, 0.5)",
                  color: tokenInfo.rugCheckScore === 100 ? "#14f195" : "#fbbf24",
                }}
              >
                🛡️ RugCheck Score: {tokenInfo.rugCheckScore}/100
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {isLoading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              {isPt ? "Consultando dados on-chain do Mint..." : "Inspecting on-chain Mint account..."}
            </div>
          ) : error ? (
            <div style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "rgba(239, 68, 68, 0.12)", color: "#fca5a5" }}>
              {error}
            </div>
          ) : tokenInfo ? (
            <>
              <div
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "0.75rem",
                  background: "hsla(var(--muted), 0.55)",
                  border: "1px solid hsl(var(--border))",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ fontFamily: "monospace", fontSize: "0.84rem", wordBreak: "break-all" }}>
                  <span style={{ color: "hsl(var(--muted-foreground))", display: "block", fontSize: "0.74rem" }}>
                    Mint Contract Address:
                  </span>
                  <strong>{tokenInfo.mint}</strong>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button type="button" className="secondary" onClick={handleCopyMint}>
                    {copied ? "✓ Copied!" : "📋 Copy Contract"}
                  </Button>
                  <a
                    href={getExplorerUrl("token", tokenInfo.mint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(20, 241, 149, 0.4)",
                      color: "#14f195",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    Solscan ↗
                  </a>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                <div style={{ padding: "0.9rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Padrão & Decimais" : "Program Standard & Decimals"}
                  </span>
                  <strong style={{ fontSize: "1rem" }}>
                    {tokenInfo.standard} · {tokenInfo.decimals} dec
                  </strong>
                </div>
                <div style={{ padding: "0.9rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    {isPt ? "Supply Total On-Chain" : "Total On-Chain Supply"}
                  </span>
                  <strong style={{ fontSize: "1rem" }}>
                    {tokenInfo.supplyUi.toLocaleString("en-US")}
                  </strong>
                </div>
                <div style={{ padding: "0.9rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    Mint Authority
                  </span>
                  <strong style={{ color: tokenInfo.mintAuthorityRevoked ? "#14f195" : "#fbbf24" }}>
                    {tokenInfo.mintAuthorityRevoked
                      ? isPt
                        ? "Revogada ✓ (Supply Fixo)"
                        : "Revoked ✓ (Fixed Supply)"
                      : isPt
                        ? "Ativa"
                        : "Active"}
                  </strong>
                </div>
                <div style={{ padding: "0.9rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "block" }}>
                    Freeze Authority
                  </span>
                  <strong style={{ color: tokenInfo.freezeAuthorityRevoked ? "#14f195" : "#fbbf24" }}>
                    {tokenInfo.freezeAuthorityRevoked
                      ? isPt
                        ? "Revogada ✓ (Pronto p/ DEX)"
                        : "Revoked ✓ (DEX Ready)"
                      : isPt
                        ? "Ativa"
                        : "Active"}
                  </strong>
                </div>
              </div>

              {/* Direct DEX Trading & Chart Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <a
                  href={`https://jup.ag/swap/SOL-${tokenInfo.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.65rem",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    background: "rgba(20, 241, 149, 0.16)",
                    border: "1px solid rgba(20, 241, 149, 0.45)",
                    color: "#14f195",
                  }}
                >
                  🪐 Trade on Jupiter ↗
                </a>
                <a
                  href={`https://raydium.io/swap/?inputMint=sol&outputMint=${tokenInfo.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.65rem",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    background: "rgba(0, 209, 255, 0.14)",
                    border: "1px solid rgba(0, 209, 255, 0.45)",
                    color: "#00d1ff",
                  }}
                >
                  💧 Trade on Raydium ↗
                </a>
                <a
                  href={`https://app.meteora.ag/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.65rem",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    background: "rgba(153, 69, 255, 0.16)",
                    border: "1px solid rgba(153, 69, 255, 0.45)",
                    color: "#c4b5fd",
                  }}
                >
                  ☄️ Trade on Meteora ↗
                </a>
                <a
                  href={`https://dexscreener.com/solana/${tokenInfo.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.65rem",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    background: "rgba(255, 255, 255, 0.07)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#f8fafc",
                  }}
                >
                  📈 DexScreener Chart ↗
                </a>
              </div>
            </>
          ) : null}

          {/* Viral CTA Footer with automatic ?ref= */}
          <div
            style={{
              marginTop: "0.5rem",
              padding: "1.15rem",
              borderRadius: "0.85rem",
              background: "linear-gradient(135deg, rgba(153, 69, 255, 0.16), rgba(20, 241, 149, 0.14))",
              border: "1px solid rgba(20, 241, 149, 0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.98rem", display: "block" }}>
                {isPt
                  ? "🚀 Crie seu próprio token blindado em segundos no CreateTokenSolana"
                  : "🚀 Launch your own 100/100 RugCheck token in seconds on CreateTokenSolana"}
              </strong>
              <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                SPL & Token-2022 · Vanity Mint · Jito Atomic Bundle · 30% Instant Affiliate Split
              </span>
            </div>
            <Link
              href={`/${referralSuffix}`}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.65rem",
                background: "linear-gradient(135deg, #9945ff 0%, #14f195 100%)",
                color: "#09090b",
                fontWeight: 800,
                fontSize: "0.85rem",
              }}
            >
              {isPt ? "Criar Meu Token Agora →" : "Create My Token Now →"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
