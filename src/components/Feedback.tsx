import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import styles from './Feedback.module.css';

// SVG icons as components for simplicity
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
};

export default function Feedback({ success, tokenAddress, errorMessage }: FeedbackProps) {
  if (success) {
    return (
      <Card className={styles.success}>
        <CardHeader>
          <div className={styles.header}>
            <CheckCircle />
            <CardTitle>Token criado com sucesso!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className={styles.address}>{tokenAddress}</p>
          <a
            href={`https://solscan.io/token/${tokenAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Ver no Solscan (Devnet)
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
        <p className={styles.errorMessage}>{errorMessage || "Algo deu errado durante a criação do token."}</p>
      </CardContent>
    </Card>
  );
}
