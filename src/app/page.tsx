import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Link from "next/link";
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Card style={{width: '100%', maxWidth: '32rem'}}>
        <CardHeader>
          <CardTitle>Bem-vindo ao Create Token Solana 🚀</CardTitle>
          <CardDescription>
            Crie tokens SPL na blockchain Solana de forma simples, rápida e segura.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <p className={styles.description}>
            Conecte sua carteira, preencha os detalhes do seu token e lance-o na rede com apenas alguns cliques.
          </p>
          <Button asChild>
            <Link href="/create">Comece a Criar Agora</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
