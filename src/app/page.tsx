import { Button } from "../components/ui/button";
import styles from './Home.module.css';
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Crie seu Token na Solana</h1>
        <p className={styles.description}>
          Lance seu próprio token SPL na blockchain Solana de forma simples, rápida e segura. Conecte sua carteira, preencha os detalhes e crie em minutos.
        </p>
        <div className={styles.buttonContainer}>
          <Button asChild>
            <Link href="/create">Começar Agora</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
