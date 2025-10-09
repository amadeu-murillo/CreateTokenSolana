import { NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ParsedInstruction, SystemProgram } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_TOKEN_SOL } from '@/lib/constants';

// The affiliate commission is 10% of the service fee
const AFFILIATE_COMMISSION_SOL = SERVICE_FEE_CREATE_TOKEN_SOL * 0.10;
const AFFILIATE_COMMISSION_LAMPORTS = AFFILIATE_COMMISSION_SOL * LAMPORTS_PER_SOL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 });
  }

  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const affiliatePublicKey = new PublicKey(wallet);

    // Fetch the last 100 signatures for the affiliate address
    const signatures = await connection.getSignaturesForAddress(affiliatePublicKey, { limit: 100 });

    let totalEarnings = 0;
    let referralCount = 0;
    const transactions = [];

    // Process the 100 most recent transactions
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
          
          // Check if it is a commission transfer to the affiliate (with a small tolerance)
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
    
    // Sort transactions from newest to oldest
    transactions.sort((a, b) => b.blockTime - a.blockTime);

    return NextResponse.json({
      totalEarningsSol: totalEarnings / LAMPORTS_PER_SOL,
      referralCount,
      transactions: transactions.slice(0, 10) // Return only the last 10 transactions
    });

  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
