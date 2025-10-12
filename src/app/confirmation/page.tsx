"use client";

import { useSearchParams } from "next/navigation";
import Feedback from "@/components/Feedback";
import Link from "next/link";
import styles from "./Confirmation.module.css";
import { Button } from "@/components/ui/button";
import Notification from "@/components/ui/Notification"; // Importado
import { useState } from "react"; // Importado

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");
  
  // Estado para controlar a visibilidade do aviso informativo
  const [isInfoVisible, setIsInfoVisible] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>Creation Status</h2>

        {/* AVISO ADICIONADO: Explica o que fazer se o token não aparecer na carteira */}
        {status === "success" && isInfoVisible && (
          <Notification
            type="info"
            message="Your token may not immediately appear in your wallet’s main list (e.g., Phantom). This is normal! Wallets hide unknown tokens to prevent spam. To display it, go to 'Manage Token List' in your wallet, search for your token, and enable visibility."
            onClose={() => setIsInfoVisible(false)}
          />
        )}

        {status === "success" && tokenAddress ? (
          <>
            <Feedback 
              success={true} 
              tokenAddress={tokenAddress} 
              txId={txId}
            />
            <div className={styles.ctaContainer}>
                <p>Congratulations! Your token is now on the blockchain. The next step is to create a liquidity pool so it can be traded.</p>
                <Link href={`/add-liquidity`}>
                    <Button className={styles.ctaButton}>
                        Add Liquidity
                    </Button>
                </Link>
            </div>
          </>
        ) : (
          <Feedback success={false} errorMessage={errorMessage || "An unknown error occurred."} />
        )}
        <div className={styles.linkContainer}>
          <Link href="/create" className={styles.link}>
            Create another token
          </Link>
        </div>
      </div>
    </div>
  );
}
