import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreatePage() {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Crie seu Token SPL</CardTitle>
            <CardDescription>Preencha os detalhes abaixo para criar seu novo token na rede Solana.</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenForm />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Resumo de Custos</h2>
        <CostSummary />
      </div>
    </div>
  );
}
