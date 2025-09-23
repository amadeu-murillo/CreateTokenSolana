import styles from "./CostSummary.module.css";

export default function CostSummary() {
  return (
    <div className={styles.card}>
      <p>💰 Custo da Rede Solana: ~0.002 SOL</p>
      <p>⚡ Taxa de Serviço: 0.092 SOL</p>
      <hr className={styles.divider} />
      <p className={styles.total}>Total: ~0.302 SOL</p>
    </div>
  );
}
