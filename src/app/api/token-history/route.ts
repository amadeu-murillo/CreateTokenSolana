import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
        return NextResponse.json({ error: 'Endereço da carteira é obrigatório.' }, { status: 400 });
    }

    try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const publicKey = new PublicKey(wallet);

        // Esta é uma abordagem simplificada. Para produção, um indexador como Helius é recomendado.
        const allSignatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 });

        const tokenCreationTransactions = [];

        for (const sigInfo of allSignatures) {
            const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
            if (tx && tx.meta && tx.meta.err === null) {
                for (const instruction of tx.transaction.message.instructions) {
                    if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
                        const parsedInstruction = instruction as any; // Simplificando a tipagem
                        if (parsedInstruction.parsed?.type === 'initializeMint') {
                             tokenCreationTransactions.push({
                                signature: sigInfo.signature,
                                mint: parsedInstruction.parsed.info.mint,
                                blockTime: sigInfo.blockTime,
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({ history: tokenCreationTransactions });

    } catch (error) {
        console.error('Erro ao buscar histórico de tokens:', error);
        let errorMessage = 'Erro interno do servidor ao buscar o histórico.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
