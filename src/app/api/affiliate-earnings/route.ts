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

    // Busca as últimas 100 assinaturas para o endereço do afiliado
    const signatures = await connection.getSignaturesForAddress(affiliatePublicKey, { limit: 100 });

    let totalEarnings = 0;
    let referralCount = 0;
    const transactions = [];

    // Processa as 100 transações mais recentes
    for (const sigInfo of signatures) {
      if (sigInfo.err) continue;

      const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
      if (!tx || !tx.meta || tx.meta.err) continue;

      const instructions = tx.transaction.message.instructions as ParsedInstruction[];
      
      let isAffiliatePayment = false;
      let hasDevFeePayment = false;

      for (const instruction of instructions) {
        if (
          instruction.programId.equals(SystemProgram.programId) &&
          'parsed' in instruction &&
          instruction.parsed.type === 'transfer'
        ) {
          const { destination, lamports } = instruction.parsed.info;
          
          // Verifica se é uma transferência de comissão para o afiliado (com uma pequena tolerância)
          if (
            destination === affiliatePublicKey.toBase58() &&
            Math.abs(lamports - AFFILIATE_COMMISSION_LAMPORTS) < 1000 
          ) {
            isAffiliatePayment = true;
          }

          if (destination === DEV_WALLET_ADDRESS.toBase58()) {
            hasDevFeePayment = true;
          }
        }
      }

      if (isAffiliatePayment && hasDevFeePayment) {
        totalEarnings += AFFILIATE_COMMISSION_LAMPORTS;
        referralCount++;
        if (tx.blockTime) {
            transactions.push({
                signature: sigInfo.signature,
                blockTime: tx.blockTime,
                amount: AFFILIATE_COMMISSION_SOL
            });
        }
      }
    }
    
    // Ordena as transações da mais recente para a mais antiga
    transactions.sort((a, b) => b.blockTime - a.blockTime);

    return NextResponse.json({
      totalEarningsSol: totalEarnings / LAMPORTS_PER_SOL,
      referralCount,
      transactions: transactions.slice(0, 10) // Retorna apenas as 10 últimas transações
    });

  } catch (error) {
    console.error('Erro ao buscar ganhos de afiliado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
