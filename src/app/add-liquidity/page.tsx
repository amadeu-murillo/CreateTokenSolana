"use client";

import { useState, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from "@/components/ui/Notification";
import { TokenSelector } from "@/components/TokenSelector";
import { useUserTokens } from "@/hooks/useUserTokens";
import { SERVICE_FEE_CREATE_LP_SOL } from "@/lib/constants";

const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default function AddLiquidityPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

  const [selectedTokenMint, setSelectedTokenMint] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [solAmount, setSolAmount] = useState("");
  // CORREÇÃO: Padrão para 25 BPS (0.25%), uma taxa comum e válida.
  const [feeBps, setFeeBps] = useState("25");

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
    poolAddress?: string;
    txId?: string;
  } | null>(null);

  const selectedToken = useMemo(
    () => userTokens.find((t) => t.mint === selectedTokenMint) || null,
    [userTokens, selectedTokenMint]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (Number(tokenAmount) <= 0 || Number(solAmount) <= 0) {
      setFeedback({ type: "error", message: "As quantidades de token e SOL devem ser maiores que zero." });
      return;
    }
     if (!publicKey || !signTransaction || !selectedToken) {
      setFeedback({ type: "error", message: "Conecte sua carteira e preencha todos os campos." });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        action: "create",
        userWalletAddress: publicKey.toBase58(),
        baseTokenMint: selectedToken.mint,
        baseTokenDecimals: selectedToken.decimals,
        initialBaseTokenAmount: Number(tokenAmount),
        initialSolAmount: Number(solAmount),
        feeBps: Number(feeBps),
      };

      const response = await fetch("/api/create-liquidity-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Falha na criação da pool.");
      }

      const txBase64 = json.data?.serializedCreateTxBase64;
      if (!txBase64) throw new Error("Transação inválida retornada pela API.");

      const transaction = VersionedTransaction.deserialize(
        Buffer.from(txBase64, "base64")
      );

      const signedTx = await signTransaction(transaction);
      
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: false }
      );

      setFeedback({ type: "info", message: "Aguardando confirmação na blockchain..." });

      await connection.confirmTransaction(txSignature, "confirmed");

      setFeedback({
        type: "success",
        message: "Pool de liquidez criada com sucesso na Meteora!",
        txId: txSignature,
      });

    } catch (error: any) {
      console.error("❌ ERRO DETALHADO NO CLIENTE:", error);
      setFeedback({
        type: "error",
        message: `Erro ao criar pool: ${error.message || "Erro desconhecido."}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !publicKey || isLoading || !selectedToken || !tokenAmount || !solAmount;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Criar Pool de Liquidez</h1>
        <p className={styles.pageDescription}>
          Crie um pool de liquidez (Token/SOL) na Meteora para permitir negociações do seu token.
        </p>
      </header>
      <div className={styles.container}>
        <Card className={styles.actionCard}>
          <form onSubmit={handleSubmit}>
            <CardContent className={styles.cardContent}>
              {feedback && (
                <Notification
                  message={feedback.message}
                  type={feedback.type}
                  onClose={() => setFeedback(null)}
                  txId={feedback.txId}
                />
              )}

              <div className={styles.inputGroup}>
                <Label htmlFor="token-select">Seu Token</Label>
                <TokenSelector
                  tokens={userTokens}
                  selectedTokenMint={selectedTokenMint}
                  onSelectToken={setSelectedTokenMint}
                  isLoading={isLoadingUserTokens}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <Label htmlFor="tokenAmount">
                    Quantidade de {selectedToken?.symbol || "Tokens"} a depositar
                  </Label>
                  {selectedToken && (
                    <span className={styles.balance}>
                      Saldo: {parseFloat(selectedToken.amount).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className={styles.amountInputContainer}>
                  <Input
                    id="tokenAmount"
                    type="number"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="Ex: 1000"
                    required
                    disabled={!selectedToken || isLoading}
                    min="0.000000001"
                    step="any"
                  />
                  {selectedToken && (
                    <Button
                      type="button"
                      onClick={() => setTokenAmount(selectedToken.amount)}
                      className={styles.maxButton1}
                      disabled={isLoading}
                    >
                      MAX
                    </Button>
                  )}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <Label htmlFor="solAmount">Quantidade de SOL a depositar</Label>
                <Input
                  id="solAmount"
                  type="number"
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  placeholder="Ex: 10"
                  required
                  disabled={isLoading}
                  min="0.000000001"
                  step="any"
                />
              </div>

              <div className={styles.inputGroup}>
                <Label htmlFor="fee-tier">Taxa da Pool (Fee Tier)</Label>
                 {/* CORREÇÃO: Valores e textos do seletor foram ajustados para refletir BPS reais e porcentagens corretas. */}
                 <select 
                  id="fee-tier" 
                  value={feeBps} 
                  onChange={(e) => setFeeBps(e.target.value)}
                  className={styles.selectInput}
                  disabled={isLoading}
                >
                  <option value="1">0.01% (Ideal para stablecoins)</option>
                  <option value="5">0.05% (Pares comuns)</option>
                  <option value="25">0.25% (Recomendado)</option>
                  <option value="100">1.00% (Tokens exóticos/voláteis)</option>
                </select>
                <p className={styles.feeDescription}>Esta é a taxa que os traders pagam, que se torna sua recompensa.</p>
              </div>

            </CardContent>
            <CardFooter className={styles.cardFooter}>
              <Button type="submit" disabled={isButtonDisabled} className="w-full">
                {isLoading
                  ? "Criando pool..."
                  : `Criar Pool (Taxa: ${SERVICE_FEE_CREATE_LP_SOL})`}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <aside className={styles.infoCard}>
          <Card>
            <CardHeader>
              <CardTitle className={styles.sidebarTitle}>Como Funciona</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.infoBox}>
                <IconInfo />
                <span>
                  Este processo criará um pool DLMM na Meteora. A proporção entre Token e SOL define o preço inicial.
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

