import { NextResponse } from "next/server";

// RF06: Configuração de Rede e Taxa de Serviço
// Este endpoint retorna as URLs de RPC disponíveis e a carteira para a taxa de serviço.
export async function GET() {
  try {
    const config = {
      rpcUrls: {
        mainnet: process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
        devnet: process.env.DEVNET_RPC_URL || "https://api.devnet.solana.com",
      },
      serviceFeeWallet: process.env.SERVICE_FEE_WALLET || "YOUR_SERVICE_FEE_WALLET_PUBLIC_KEY_HERE", // Substitua por sua carteira
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao buscar configuração." },
      { status: 500 }
    );
  }
}
