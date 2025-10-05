import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_AIRDROP_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const { mint, recipients, wallet, programId } = await request.json();

        if (!mint || !recipients || !wallet || !programId || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'Dados incompletos ou inválidos.' }, { status: 400 });
        }
        
        // Valida se o programId é um dos conhecidos
        if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
            return NextResponse.json({ error: 'Program ID do token é inválido.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const payerPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(mint);
        const tokenProgramId = new PublicKey(programId);

        // Buscar informações do mint para obter os decimais, usando o programId correto
        const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', tokenProgramId);

        const instructions: TransactionInstruction[] = [
            // Aumenta a unidade de computação baseada no número de destinatários para evitar erros
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 + 40000 * recipients.length }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
            // Taxa de serviço por lote de transação
            SystemProgram.transfer({
                fromPubkey: payerPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_AIRDROP_LAMPORTS,
            }),
        ];
        
        const sourceTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey, 
            payerPublicKey, 
            false, 
            tokenProgramId
        );
        
        // Usando Promise.all para verificar as contas de token associadas (ATAs) em paralelo
        const destinationAtas = await Promise.all(recipients.map(async (recipient: { address: string }) => {
            const destinationPublicKey = new PublicKey(recipient.address);
            return getAssociatedTokenAddress(mintPublicKey, destinationPublicKey, false, tokenProgramId);
        }));

        const accountsInfo = await connection.getMultipleAccountsInfo(destinationAtas);

        recipients.forEach((recipient: { address: string, amount: number }, index: number) => {
            const destinationPublicKey = new PublicKey(recipient.address);
            const destinationAta = destinationAtas[index];
            const accountInfo = accountsInfo[index];

            // Se a conta de token associada não existir, cria a instrução para criá-la
            if (accountInfo === null) {
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        payerPublicKey,
                        destinationAta,
                        destinationPublicKey,
                        mintPublicKey,
                        tokenProgramId
                    )
                );
            }

            // Cria a instrução de transferência
            instructions.push(
                createTransferInstruction(
                    sourceTokenAccount,
                    destinationAta,
                    payerPublicKey,
                    BigInt(recipient.amount * Math.pow(10, mintInfo.decimals)),
                    [],
                    tokenProgramId
                )
            );
        });
        
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
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
