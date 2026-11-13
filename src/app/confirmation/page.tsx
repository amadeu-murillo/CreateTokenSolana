"use client";

import { useSearchParams } from "next/navigation";
import Feedback from "@/components/Feedback";
import Link from "next/link";
import styles from "./Confirmation.module.css";
import { Button } from "@/components/ui/button";
import Notification from "@/components/ui/Notification";
import { useState, Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const txId = searchParams.get("txId");
  const errorMessage = searchParams.get("error");

  const [isInfoVisible, setIsInfoVisible] = useState(true);

  return (
    <div className={styles.contentWrapper}>
      <h2 className={styles.title}>Token Launch Status</h2>

      {status === "success" && isInfoVisible && (
        <Notification
          type="info"
          message="Your token is now live on Solana! Next step: initialize a Liquidity Pool below so anyone can trade your token."
          onClose={() => setIsInfoVisible(false)}
        />
      )}

      {status === "success" && tokenAddress ? (
        <>
          <Feedback success={true} tokenAddress={tokenAddress} txId={txId} />
          <div className={styles.ctaContainer}>
            <p>
              Ready to make your token tradable? Click below to pre-select this token in the
              Liquidity Pool Creator.
            </p>
            <Link href={`/add-liquidity?mint=${encodeURIComponent(tokenAddress)}`}>
              <Button className={styles.ctaButton}>
                💧 Create Liquidity Pool for This Token →
              </Button>
            </Link>
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
