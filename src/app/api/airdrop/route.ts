import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getMint } from '@solana/spl-token';
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

        // Buscar informações do mint para obter os decimais
        const mintInfo = await getMint(connection, mintPublicKey);

        const instructions: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 * recipients.length }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
            SystemProgram.transfer({
                fromPubkey: payerPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_AIRDROP_LAMPORTS,
            })
        ];
        
        const sourceTokenAccount = await getAssociatedTokenAddress(mintPublicKey, payerPublicKey);
        
        // MODIFICAÇÃO: Lógica robusta para criar ATAs se não existirem
        for (const recipient of recipients) {
            try {
                const destinationPublicKey = new PublicKey(recipient.address);
                const destinationAta = await getAssociatedTokenAddress(mintPublicKey, destinationPublicKey);
                
                const accountInfo = await connection.getAccountInfo(destinationAta);
                if (accountInfo === null) {
                    // Adiciona instrução para criar a ATA de destino se não existir
                    instructions.push(
                        createAssociatedTokenAccountInstruction(
                            payerPublicKey,
                            destinationAta,
                            destinationPublicKey,
                            mintPublicKey
                        )
                    );
                }

                instructions.push(
                    createTransferInstruction(
                        sourceTokenAccount,
                        destinationAta,
                        payerPublicKey,
                        BigInt(recipient.amount * Math.pow(10, mintInfo.decimals))
                    )
                );
            } catch (e) {
                console.warn(`Endereço inválido ou problema com ${recipient.address}, pulando.`);
            }
        }
        
        if (instructions.length <= 1) { // Apenas a taxa de serviço
            return NextResponse.json({ error: 'Nenhum destinatário válido fornecido.' }, { status: 400 });
        }
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        const messageV0 = new TransactionMessage({
            payerKey: payerPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        const serializedTransaction = transaction.serialize();
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

        return NextResponse.json({ transaction: base64Transaction });

    } catch (error) {
        console.error('Erro na API de airdrop:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
