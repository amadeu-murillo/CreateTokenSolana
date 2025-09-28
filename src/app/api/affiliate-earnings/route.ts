import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedInstruction, SystemProgram } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_TOKEN_SOL } from '@/lib/constants';

// A comissão de afiliado é 10% da taxa de serviço
const AFFILIATE_COMMISSION_SOL = SERVICE_FEE_CREATE_TOKEN_SOL * 0.10;
const AFFILIATE_COMMISSION_LAMPORTS = AFFILIATE_COMMISSION_SOL * LAMPORTS_PER_SOL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Endereço da carteira é obrigatório.' }, { status: 400 });
  }

  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const affiliatePublicKey = new PublicKey(wallet);

    // Busca as últimas 1000 assinaturas para o endereço do afiliado
    const signatures = await connection.getSignaturesForAddress(affiliatePublicKey, { limit: 100 });

    let totalEarnings = 0;
    let referralCount = 0;

    // Limita o número de transações a serem processadas para evitar sobrecarga/timeout
    // Processa as 200 mais recentes, o que é suficiente para a maioria dos casos
    const transactionsToParse = signatures.slice(0, 200); 

    for (const sigInfo of transactionsToParse) {
      // Pula transações com erro
      if (sigInfo.err) continue;

      const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
      if (!tx || !tx.meta || tx.meta.err) continue;

      const instructions = tx.transaction.message.instructions as ParsedInstruction[];
      
      let isAffiliatePayment = false;
      let hasDevFeePayment = false;

      // Itera sobre as instruções da transação para validar se é um pagamento de afiliado
      for (const instruction of instructions) {
        if (
          instruction.programId.equals(SystemProgram.programId) &&
          'parsed' in instruction &&
          instruction.parsed.type === 'transfer'
        ) {
          const { destination, lamports } = instruction.parsed.info;
          
          // Verifica se é uma transferência de comissão para o afiliado
          // Usamos uma tolerância para o valor, caso a taxa de serviço mude ligeiramente
          if (
            destination === affiliatePublicKey.toBase58() &&
            Math.abs(lamports - AFFILIATE_COMMISSION_LAMPORTS) < 1000 
          ) {
            isAffiliatePayment = true;
          }
          // Verifica se a taxa para o desenvolvedor também está na transação
          if (destination === DEV_WALLET_ADDRESS.toBase58()) {
            hasDevFeePayment = true;
          }
        }
      }

      // Se ambas as condições forem verdadeiras, contabiliza como um referral válido
      if (isAffiliatePayment && hasDevFeePayment) {
        totalEarnings += AFFILIATE_COMMISSION_LAMPORTS;
        referralCount++;
      }
    }

    return NextResponse.json({
      totalEarningsSol: totalEarnings / LAMPORTS_PER_SOL,
      referralCount,
    });

  } catch (error) {
    console.error('Erro ao buscar ganhos de afiliado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
