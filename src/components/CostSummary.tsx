import styles from "./CostSummary.module.css";

const IconZap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);

export default function CostSummary() {
  return (
    <div className={styles.card}>
        <div className={styles.item}>
            <span>💰 Custo da Rede Solana</span>
            <span>~0.002 SOL</span>
        </div>
        <div className={styles.item}>
            <span><IconZap /> Taxa de Serviço</span>
            <span>0.092 SOL</span>
        </div>
        <hr className={styles.divider} />
        <div className={`${styles.item} ${styles.total}`}>
            <p>Total:</p>
            <p>~0.094 SOL</p>
        </div>
    </div>
  );
}
