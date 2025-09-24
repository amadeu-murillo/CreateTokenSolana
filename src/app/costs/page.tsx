import CostSummary from "@/components/CostSummary";
import styles from './Costs.module.css';

export default function CostsPage() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Resumo de Custos</h2>
      <CostSummary />
    </div>
  );
}