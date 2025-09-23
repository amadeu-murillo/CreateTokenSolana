type FeedbackProps = {
  success: boolean;
  tokenAddress?: string;
  errorMessage?: string;
};

export default function Feedback({ success, tokenAddress, errorMessage }: FeedbackProps) {
  if (success) {
    return (
      <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        ✅ Token criado com sucesso! <br />
        Endereço: {tokenAddress} <br />
        <a
          href={`https://solscan.io/token/${tokenAddress}`}
          target="_blank"
          className="text-blue-600 underline"
        >
          Ver no Solscan
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      ❌ Erro: {errorMessage || "Algo deu errado"}
    </div>
  );
}
