"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Feedback from "@/components/Feedback";
import Notification from "@/components/ui/Notification";
import styles from "./Confirmation.module.css";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");

  const [isInfoVisible, setIsInfoVisible] = useState(true);

  const encodedMint = tokenAddress ? encodeURIComponent(tokenAddress) : "";

  return (
    <div className={styles.contentWrapper}>
      <h2 className={styles.title}>Token Launch Status</h2>

      {status === "success" && isInfoVisible && (
        <Notification
          type="info"
          message="Seu token já está ativo na Solana! Siga os 3 passos abaixo para adicionar liquidez, queimar o LP (Rug-Proof) e distribuir para a comunidade."
          onClose={() => setIsInfoVisible(false)}
        />
      )}

      {status === "success" && tokenAddress ? (
        <>
          <Feedback success={true} tokenAddress={tokenAddress} txId={txId} />

          {/* Phase 3: Post-Creation 3-Step Funnel passing ?mint=ENDERECO_DO_MINT */}
          <div className={styles.funnelCard}>
            <h3 className={styles.funnelTitle}>🚀 Próximos Passos para Listar seu Token</h3>
            <p className={styles.funnelSubtitle}>
              O endereço do seu novo token (<code>{tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}</code>) será selecionado automaticamente em cada etapa:
            </p>

            <div className={styles.funnelStepsGrid}>
              <Link
                href={`/add-liquidity?mint=${encodedMint}`}
                className={styles.stepActionLink}
              >
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>Passo 1 · Negociação DEX</span>
                  <strong>💧 Criar Pool de Liquidez</strong>
                  <span>
                    Inicialize seu par na Raydium CPMM ou Meteora DAMM para liberar compras e vendas.
                  </span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>

              <Link href={`/burn?mint=${encodedMint}`} className={styles.stepActionLink}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>Passo 2 · Selo Rug-Proof</span>
                  <strong>🔥 Queimar Liquidez / Supply (LP Burn)</strong>
                  <span>
                    Queime LP tokens ou parte do supply e gere seu Certificado Visual PNG verificável.
                  </span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>

              <Link href={`/airdrop?mint=${encodedMint}`} className={styles.stepActionLink}>
                <div className={styles.stepInfo}>
                  <span className={styles.stepBadge}>Passo 3 · Distribuição Viral</span>
                  <strong>📦 Fazer Airdrop para Comunidade</strong>
                  <span>
                    Envie tokens em lote para múltiplas carteiras com criação automática de ATA.
                  </span>
                </div>
                <span className={styles.stepArrow}>→</span>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <Feedback success={false} errorMessage={errorMessage || "An unknown error occurred."} />
      )}

      <div className={styles.linkContainer}>
        <Link href="/" className={styles.link}>
          ← Back to Token Creator
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Loading confirmation...</div>}>
        <ConfirmationContent />
      </Suspense>
    </div>
  );
}
