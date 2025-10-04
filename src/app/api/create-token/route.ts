import { NextResponse } from 'next/server';
import { orcaWhirlpoolService } from '@/lib/services/orcaWhirlpoolService';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Commitment, Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';

// Implementação de uma carteira "dummy" para o backend, que não assina transações.
class DummyWallet implements Wallet {
    constructor(readonly payer: Keypair) {}

    get publicKey(): PublicKey {
        return this.payer.publicKey;
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        // O backend não deve assinar, apenas construir a transação.
        // A assinatura real acontece no frontend com a carteira do usuário.
        return tx;
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        // O backend não deve assinar, apenas construir a transação.
        return txs;
    }
}


export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { userWalletAddress, tokenMint, tokenAmount, poolAddress, lowerPrice, upperPrice } = body;
        if (!userWalletAddress || !tokenMint || !tokenAmount || !poolAddress || !lowerPrice || !upperPrice ) {
            return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed' as Commitment);
        const userPublicKey = new PublicKey(userWalletAddress);
        
        // Usamos uma carteira "dummy" porque o backend apenas constrói a transação.
        // A assinatura real será feita pelo frontend.
        const dummyWallet = new DummyWallet(Keypair.generate());
        const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' });

        const result = await orcaWhirlpoolService.createLiquidityPool({
            provider,
            poolAddress: new PublicKey(poolAddress),
            tokenMint: new PublicKey(tokenMint),
            tokenAmount: parseFloat(tokenAmount), // Convertido para número
            lowerPrice: parseFloat(lowerPrice),   // Convertido para número
            upperPrice: parseFloat(upperPrice),   // Convertido para número
            user: userPublicKey,
        });

        // O `result.transaction` é um `TransactionPayload`, que contém a transação e os signers.
        // Acessamos a transação através de `result.transaction.transaction`.
        const transaction = result.transaction.transaction;

        // Serializamos a transação para enviar ao frontend.
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

        return NextResponse.json({
            transaction: serializedTransaction,
            positionMint: result.positionMint
        });

    } catch (error: any) {
        console.error('Erro na API de adicionar liquidez:', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}

