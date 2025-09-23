import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import styles from './Create.module.css';

export default function CreatePage() {
  return (
    <div className={styles.grid}>
      <Card>
        <CardHeader>
          <CardTitle>Crie seu Token SPL</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para criar seu novo token na rede Solana.</CardDescription>
        </CardHeader>
        <CardContent>
          <TokenForm />
        </CardContent>
      </Card>
      <div className={styles.summaryContainer}>
        <h2 className={styles.summaryTitle}>Resumo de Custos</h2>
        <CostSummary />
      </div>
    </div>
  );
}
