export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bem-vindo 🚀</h2>
      <p>
        Crie tokens SPL na blockchain Solana de forma simples, rápida e segura.
      </p>
      <a
        href="/create"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Criar Token
      </a>
    </div>
  );
}
