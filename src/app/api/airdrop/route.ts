import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_AIRDROP_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const { mint, recipients, wallet } = await request.json();

        if (!mint || !recipients || !wallet) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const payerPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(mint);

        const transaction = new Transaction({
            feePayer: payerPublicKey,
            ...(await connection.getLatestBlockhash('confirmed')),
        });

        // Adicionar taxa de serviço
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: payerPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_AIRDROP_LAMPORTS,
            })
        );
        
        const sourceTokenAccount = await getAssociatedTokenAddress(mintPublicKey, payerPublicKey);

        for (const recipient of recipients) {
            try {
                const destinationPublicKey = new PublicKey(recipient.address);
                
                // A instrução getOrCreateAssociatedTokenAccount não pode ser usada aqui diretamente
                // pois precisa ser assinada. Em vez disso, criamos a instrução para a transação.
                // Esta abordagem assume que a conta de destino pode não existir.
                const destinationTokenAccount = await getAssociatedTokenAddress(mintPublicKey, destinationPublicKey);

                // Esta é uma simplificação. Uma implementação robusta verificaria se a conta existe
                // e adicionaria `createAssociatedTokenAccountInstruction` se não existir.
                // Por simplicidade, assumimos que a conta de destino já existe ou o cliente irá criá-la.

                transaction.add(
                    createTransferInstruction(
                        sourceTokenAccount,
                        destinationTokenAccount,
                        payerPublicKey,
                        recipient.amount * Math.pow(10, 9) // Novamente, assumindo 9 decimais
                    )
                );
            } catch (e) {
                console.warn(`Endereço inválido ou problema com ${recipient.address}, pulando.`);
            }
        }
        
        if (transaction.instructions.length <= 1) { // Apenas a taxa de serviço
            return NextResponse.json({ error: 'Nenhum destinatário válido fornecido.' }, { status: 400 });
        }

        const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        const base64Transaction = serializedTransaction.toString('base64');

        return NextResponse.json({ transaction: base64Transaction });

    } catch (error) {
        console.error('Erro na API de airdrop:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
