"use client";
import { getStoredAffiliateRef } from "@/lib/affiliateAttribution";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchOnChainTokenMetadata,
  OnChainTokenMetadataResult,
} from "@/lib/services/tokenMetadataReader";
import { SITE_URL } from "@/lib/seo";

interface ActiveVestingLockItem {
  escrowAddress: string;
  mint: string;
  amountUi: string;
  unlockUnix: number;
  beneficiary: string;
  signature?: string;
}

function PublicTokenPageInner() {
  const params = useParams<{ mint: string }>();
  const searchParams = useSearchParams();
  const mintParam = typeof params?.mint === "string" ? params.mint : "";
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster, getExplorerUrl } = useCluster();
  const langCtx = useLanguage();
  const locale = langCtx?.locale || "en";
  const isPt = locale === "pt" || locale === "pt-BR";

  const [tokenInfo, setTokenInfo] = useState<OnChainTokenMetadataResult | null>(null);
  const [vestingLocks, setVestingLocks] = useState<ActiveVestingLockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [blinkCopied, setBlinkCopied] = useState(false);

  const queryRef = searchParams.get("ref");
  const activeRef =
    queryRef ||
    (publicKey ? publicKey.toBase58() : null) ||
    (typeof window !== "undefined" ? getStoredAffiliateRef() : null);

  useEffect(() => {
    let active = true;
    const inspectToken = async () => {
      if (!mintParam || !connection) return;
      setIsLoading(true);
      setError(null);

      try {
        const mintPubkey = new PublicKey(mintParam);
        const onChainMeta = await fetchOnChainTokenMetadata(connection, mintPubkey);

        // Enrich with localStorage cache only if on-chain URI was empty/unreachable
        try {
          const rawDossier = localStorage.getItem("lastCreatedTokenDossier");
          if (rawDossier) {
            const parsed = JSON.parse(rawDossier);
            if (parsed.mintAddress === mintParam) {
              if (!onChainMeta.image && parsed.imageUrl) {
                onChainMeta.image = parsed.imageUrl;
              }
              if (
                onChainMeta.metadataSource === "fallback" &&
                parsed.name &&
                parsed.symbol
              ) {
                onChainMeta.name = parsed.name;
                onChainMeta.symbol = parsed.symbol;
              }
            }
          }
        } catch {
          // Ignore storage read errors
        }

        if (active) {
          setTokenInfo(onChainMeta);
        }

        // Query on-chain vesting/LP locks for this mint
        try {
          const res = await fetch(
            `/api/vesting?mint=${encodeURIComponent(mintParam)}&network=${cluster}`
          );
          if (res.ok) {
            const data = await res.json();
            if (active && Array.isArray(data.locks)) {
              setVestingLocks(data.locks);
            }
          }
        } catch {
          // Also check local cached locks
          try {
            const localLocksRaw = localStorage.getItem("cts_vesting_locks");
            if (localLocksRaw) {
              const allLocks = JSON.parse(localLocksRaw);
              if (Array.isArray(allLocks) && active) {
                setVestingLocks(
                  allLocks.filter((l: ActiveVestingLockItem) => l.mint === mintParam)
                );
              }
            }
          } catch {
            // Ignore
          }
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

  const referralSuffix = activeRef ? `?ref=${activeRef}` : "";
  const blinkActionUrl = `${SITE_URL}/token/${mintParam}${referralSuffix}`;
  const dialectBlinkUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(
    `${SITE_URL}/api/actions/token/${mintParam}${referralSuffix}`
  )}`;

  const handleCopyBlink = () => {
    navigator.clipboard?.writeText(blinkActionUrl);
    setBlinkCopied(true);
    setTimeout(() => setBlinkCopied(false), 2000);
  };

  const shareBlinkOnXUrl = tokenInfo
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        isPt
          ? `🚀 Negocie $${tokenInfo.symbol} (${tokenInfo.name}) direto no feed do X via Solana Blink!\n\n🛡️ Nota RugCheck: ${tokenInfo.rugCheckScore}/100\n🪙 Mint: ${tokenInfo.mint}\n\n⚡ Swap Instantâneo & Auditoria On-Chain:\n${blinkActionUrl}\nVia @CreateTokenSols`
          : `🚀 Trade $${tokenInfo.symbol} (${tokenInfo.name}) directly in your X feed via Solana Blink!\n\n🛡️ RugCheck Security Score: ${tokenInfo.rugCheckScore}/100\n🪙 Mint: ${tokenInfo.mint}\n\n⚡ Instant Swap & On-Chain Audit:\n${blinkActionUrl}\nVia @CreateTokenSols`
      )}`
    : "#";

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", padding: "1.5rem 1rem" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              {tokenInfo?.image && (
                <img
                  src={tokenInfo.image}
                  alt={tokenInfo.name || "Token"}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #14f195",
                  }}
                />
              )}
              <div>
                <CardTitle>
                  {tokenInfo
                    ? `${tokenInfo.name} ($${tokenInfo.symbol})`
                    : `Solana Asset (${mintParam.slice(0, 6)}...${mintParam.slice(-4)})`}
                </CardTitle>
                <CardDescription>
                  {isPt
                    ? `Página Pública On-Chain Verificada & Solana Blink (${cluster})`
                    : `Verified On-Chain Public Token Profile & Solana Blink (${cluster})`}
                </CardDescription>
              </div>
            </div>

            {tokenInfo && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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

                <a
                  href={shareBlinkOnXUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    background: "linear-gradient(135deg, #1d9bf0 0%, #9945ff 100%)",
                    color: "#ffffff",
                    textDecoration: "none",
                  }}
                >
                  ⚡ Share Blink on X ↗
                </a>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {isLoading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              {isPt
                ? "Consultando metadados reais on-chain (Token-2022 TLV / Metaplex PDA)..."
                : "Inspecting real on-chain Mint & Metadata PDA..."}
            </div>
          ) : error ? (
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "0.75rem",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          ) : tokenInfo ? (
            <>
              {tokenInfo.description && (
                <div
                  style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "0.88rem",
                    lineHeight: 1.5,
                  }}
                >
                  {tokenInfo.description}
                  {(tokenInfo.website || tokenInfo.twitter || tokenInfo.telegram) && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.85rem",
                        marginTop: "0.6rem",
                        flexWrap: "wrap",
                        fontSize: "0.8rem",
                      }}
                    >
                      {tokenInfo.website && (
                        <a
                          href={tokenInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#14f195", textDecoration: "underline" }}
                        >
                          🌐 Website ↗
                        </a>
                      )}
                      {tokenInfo.twitter && (
                        <a
                          href={
                            tokenInfo.twitter.startsWith("http")
                              ? tokenInfo.twitter
                              : `https://x.com/${tokenInfo.twitter.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#00d1ff", textDecoration: "underline" }}
                        >
                          𝕏 Twitter / X ↗
                        </a>
                      )}
                      {tokenInfo.telegram && (
                        <a
                          href={
                            tokenInfo.telegram.startsWith("http")
                              ? tokenInfo.telegram
                              : `https://t.me/${tokenInfo.telegram.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#c4b5fd", textDecoration: "underline" }}
                        >
                          ✈️ Telegram ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                  <span
                    style={{
                      color: "hsl(var(--muted-foreground))",
                      display: "block",
                      fontSize: "0.74rem",
                    }}
                  >
                    Mint Contract Address ({tokenInfo.metadataSource}):
                  </span>
                  <strong>{tokenInfo.mint}</strong>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button type="button" className="secondary" onClick={handleCopyMint}>
                    {copied ? "✓ Copied!" : "📋 Copy Contract"}
                  </Button>
                  <Button type="button" className="secondary" onClick={handleCopyBlink}>
                    {blinkCopied ? "✓ Blink URL Copied!" : "⚡ Copy Blink URL"}
                  </Button>
                  <a
                    href={dialectBlinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(153, 69, 255, 0.5)",
                      color: "#c4b5fd",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    Dialect Blink ↗
                  </a>
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
                <div
                  style={{
                    padding: "0.9rem",
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      display: "block",
                    }}
                  >
                    {isPt ? "Padrão & Decimais" : "Program Standard & Decimals"}
                  </span>
                  <strong style={{ fontSize: "1rem" }}>
                    {tokenInfo.standard} · {tokenInfo.decimals} dec
                  </strong>
                </div>
                <div
                  style={{
                    padding: "0.9rem",
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      display: "block",
                    }}
                  >
                    {isPt ? "Supply Total On-Chain" : "Total On-Chain Supply"}
                  </span>
                  <strong style={{ fontSize: "1rem" }}>
                    {tokenInfo.supplyUi.toLocaleString("en-US")}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "0.9rem",
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      display: "block",
                    }}
                  >
                    Mint Authority
                  </span>
                  <strong
                    style={{ color: tokenInfo.mintAuthorityRevoked ? "#14f195" : "#fbbf24" }}
                  >
                    {tokenInfo.mintAuthorityRevoked
                      ? isPt
                        ? "Revogada ✓ (Supply Fixo)"
                        : "Revoked ✓ (Fixed Supply)"
                      : isPt
                      ? "Ativa"
                      : "Active"}
                  </strong>
                </div>
                <div
                  style={{
                    padding: "0.9rem",
                    borderRadius: "0.75rem",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "hsl(var(--muted-foreground))",
                      display: "block",
                    }}
                  >
                    Freeze Authority
                  </span>
                  <strong
                    style={{ color: tokenInfo.freezeAuthorityRevoked ? "#14f195" : "#fbbf24" }}
                  >
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

              {/* Phase 5: On-Chain LP Lock & Team Vesting Status */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.8rem",
                  border: "1px solid rgba(20, 241, 149, 0.35)",
                  background: "rgba(20, 241, 149, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.92rem", color: "#14f195" }}>
                      🔒{" "}
                      {isPt
                        ? "Status de LP Lock & Team Vesting On-Chain"
                        : "On-Chain LP Lock & Team Vesting Status"}
                    </strong>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "hsl(var(--muted-foreground))",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vestingLocks.length > 0
                        ? isPt
                          ? `${vestingLocks.length} trava(s) de tokens/LP verificada(s) on-chain via Memo Program + Escrow.`
                          : `${vestingLocks.length} verified on-chain token/LP lock(s) found via Memo Program + Escrow.`
                        : isPt
                        ? "Tranque LP Tokens ou alocação da equipe em /vesting para exibir o certificado verificável aqui."
                        : "Lock LP Tokens or team allocation in /vesting to display a verified lock badge here."}
                    </p>
                  </div>
                  <Link
                    href={`/vesting?mint=${tokenInfo.mint}${activeRef ? `&ref=${activeRef}` : ""}`}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "0.6rem",
                      background: "rgba(20, 241, 149, 0.16)",
                      border: "1px solid rgba(20, 241, 149, 0.45)",
                      color: "#14f195",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {isPt ? "🔒 Criar / Verificar Lock →" : "🔒 Create / Verify Lock →"}
                  </Link>
                </div>

                {vestingLocks.length > 0 && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      display: "grid",
                      gap: "0.5rem",
                    }}
                  >
                    {vestingLocks.map((lock, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "0.55rem",
                          background: "rgba(9, 9, 11, 0.7)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        <span>
                          <strong>{lock.amountUi}</strong> ${tokenInfo.symbol} · Escrow:{" "}
                          <code>
                            {lock.escrowAddress.slice(0, 6)}...{lock.escrowAddress.slice(-4)}
                          </code>
                        </span>
                        <span style={{ color: "#14f195", fontWeight: 700 }}>
                          Unlock: {new Date(lock.unlockUnix * 1000).toUTCString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                  href={shareBlinkOnXUrl}
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
                  ⚡ Share Blink on X ↗
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
              background:
                "linear-gradient(135deg, rgba(153, 69, 255, 0.16), rgba(20, 241, 149, 0.14))",
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
                SPL & Token-2022 · 100/100 RugCheck · Raydium CPMM · Verified Vesting · 30% On-Chain Affiliates
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

export default function PublicTokenPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <PublicTokenPageInner />
    </Suspense>
  );
}
