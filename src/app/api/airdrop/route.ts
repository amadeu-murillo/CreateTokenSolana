import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_AIRDROP_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const { mint, recipients, wallet, programId } = await request.json();

        if (!mint || !recipients || !wallet || !programId) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }
        
        // Valida se o programId é um dos conhecidos
        if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
            return NextResponse.json({ error: 'Program ID inválido.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const payerPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(mint);
        const tokenProgramId = new PublicKey(programId);

        // Buscar informações do mint para obter os decimais, usando o programId correto
        const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', tokenProgramId);

        const instructions: TransactionInstruction[] = [
            // Aumenta a unidade de computação baseada no número de destinatários
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 + 30000 * recipients.length }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        ];
        
        // Adiciona a taxa de serviço apenas na primeira transação (se houver batch)
        // A lógica de batch está no front-end, mas aqui tratamos cada chamada como uma transação.
        instructions.push(SystemProgram.transfer({
            fromPubkey: payerPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_AIRDROP_LAMPORTS / recipients.length, // Custo proporcional
        }));
        
        const sourceTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey, 
            payerPublicKey, 
            false, 
            tokenProgramId
        );
        
        for (const recipient of recipients) {
            try {
                const destinationPublicKey = new PublicKey(recipient.address);
                const destinationAta = await getAssociatedTokenAddress(
                    mintPublicKey, 
                    destinationPublicKey,
                    false,
                    tokenProgramId
                );
                
                const accountInfo = await connection.getAccountInfo(destinationAta);
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
            } catch (e) {
                console.warn(`Endereço inválido ou problema com ${recipient.address}, pulando.`);
            }
        }
        
        if (instructions.length <= 2) { // Apenas CU e taxa
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

