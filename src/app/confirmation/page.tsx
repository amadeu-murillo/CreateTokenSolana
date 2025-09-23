"use client";

import { useSearchParams } from "next/navigation";
import Feedback from "@/components/Feedback";
import Link from "next/link";
import styles from "./Confirmation.module.css";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId"); // Captura o ID da transação da URL
  const errorMessage = searchParams.get("error");

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>Status da Criação</h2>
        {status === "success" && tokenAddress ? (
          <Feedback 
            success={true} 
            tokenAddress={tokenAddress} 
            txId={txId} // Passa o txId para o componente de feedback
          />
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
