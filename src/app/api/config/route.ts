import { NextResponse } from "next/server";
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT } from "@/lib/constants";

// RF06: Configuração de Rede e Taxa de Serviço
// Este endpoint retorna a URL de RPC e a carteira para a taxa de serviço.
export async function GET() {
  try {
    const config = {
      rpcUrl: RPC_ENDPOINT,
      serviceFeeWallet: DEV_WALLET_ADDRESS.toBase58(),
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
