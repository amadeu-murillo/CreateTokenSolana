import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, XCircle } from "lucide-react";

type FeedbackProps = {
  success: boolean;
  tokenAddress?: string;
  errorMessage?: string;
};

export default function Feedback({ success, tokenAddress, errorMessage }: FeedbackProps) {
  if (success) {
    return (
      <Card className="border-green-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            <CardTitle>Token criado com sucesso!</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-mono break-all bg-muted p-2 rounded-md">{tokenAddress}</p>
          <a
            href={`https://solscan.io/token/${tokenAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline mt-4 inline-block"
          >
            Ver no Solscan (Devnet)
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <XCircle className="text-red-500" />
          <CardTitle>Ocorreu um erro</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-red-700 dark:text-red-400">{errorMessage || "Algo deu errado durante a criação do token."}</p>
      </CardContent>
    </Card>
  );
}
