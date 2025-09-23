import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Bem-vindo ao Create Token Solana 🚀</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Crie tokens SPL na blockchain Solana de forma simples, rápida e segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            Conecte sua carteira, preencha os detalhes do seu token e lance-o na rede com apenas alguns cliques.
          </p>
          <Button asChild size="lg">
            <Link href="/create">Comece a Criar Agora</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
