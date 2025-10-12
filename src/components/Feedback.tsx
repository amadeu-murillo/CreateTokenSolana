import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from './Feedback.module.css';

// Ícones SVG
const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconSuccess}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const XCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconError}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

type FeedbackProps = {
  success: boolean;
  tokenAddress?: string;
  errorMessage?: string;
  txId?: string | null; // Adicionado para receber o ID da transação
};

export default function Feedback({ success, tokenAddress, errorMessage, txId }: FeedbackProps) {
  // ALTERAÇÃO: Remove o parâmetro `?cluster=devnet` para que os links apontem para a mainnet do Solscan.
  const explorerLink = txId 
    ? `https://solscan.io/tx/${txId}`
    : `https://solscan.io/token/${tokenAddress}`;

  if (success) {
    return (
      <Card className={styles.success}>
        <CardHeader>
          <div className={styles.header}>
            <CheckCircle />
            <CardTitle>Token created successfully!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>Token address:</p>
          <p className={styles.address}>{tokenAddress}</p>
          <a
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {txId ? 'View transaction on Solscan' : 'View token on Solscan'}
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.error}>
      <CardHeader>
        <div className={styles.header}>
          <XCircle />
          <CardTitle>Ocorreu um erro</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className={styles.errorMessage}>{decodeURIComponent(errorMessage || "Something went wrong while creating the token.")}</p>
      </CardContent>
    </Card>
  );
}
