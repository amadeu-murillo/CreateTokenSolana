"use client";

import { useSearchParams } from "next/navigation";
import Feedback from "@/components/Feedback";
import Link from "next/link";
import styles from "./Confirmation.module.css";
import { Button } from "@/components/ui/button";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>Status da Criação</h2>
        {status === "success" && tokenAddress ? (
          <>
            <Feedback 
              success={true} 
              tokenAddress={tokenAddress} 
              txId={txId}
            />
            {/* MODIFICAÇÃO: Adicionado botão de call-to-action para criar pool de liquidez */}
            <div className={styles.ctaContainer}>
                <p>Parabéns! O seu token está na blockchain. O próximo passo é torná-lo negociável.</p>
                <Link href={`/create-liquidity-pool?mint=${tokenAddress}`}>
                    <Button className={styles.ctaButton}>
                        Criar Pool de Liquidez (~0.3 SOL)
                    </Button>
                </Link>
            </div>
          </>
        ) : (
          <Feedback success={false} errorMessage={errorMessage || "Ocorreu um erro desconhecido."} />
        )}
        <div className={styles.linkContainer}>
          <Link href="/create" className={styles.link}>
            Criar outro token
          </Link>
        </div>
      </div>
    </div>
  );
}
