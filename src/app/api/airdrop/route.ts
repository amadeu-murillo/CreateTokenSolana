import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_AIRDROP_LAMPORTS } from '@/lib/constants';

export async function POST(request: Request) {
    try {
        const { mint, recipients, wallet, programId } = await request.json();

        if (!mint || !recipients || !wallet || !programId || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json({ error: 'Incomplete or invalid data.' }, { status: 400 });
        }
        
        // Validate if the programId is one of the known ones
        if (programId !== TOKEN_PROGRAM_ID.toBase58() && programId !== TOKEN_2022_PROGRAM_ID.toBase58()) {
            return NextResponse.json({ error: 'Invalid token Program ID.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const payerPublicKey = new PublicKey(wallet);
        const mintPublicKey = new PublicKey(mint);
        const tokenProgramId = new PublicKey(programId);

        // Fetch mint information to get decimals using the correct programId
        const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', tokenProgramId);

        const instructions: TransactionInstruction[] = [
            // Increase compute unit limit based on number of recipients to avoid errors
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 + 40000 * recipients.length }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
            // Service fee per transaction batch
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
        
        // Use Promise.all to check associated token accounts (ATAs) in parallel
        const destinationAtas = await Promise.all(recipients.map(async (recipient: { address: string }) => {
            const destinationPublicKey = new PublicKey(recipient.address);
            return getAssociatedTokenAddress(mintPublicKey, destinationPublicKey, false, tokenProgramId);
        }));

        const accountsInfo = await connection.getMultipleAccountsInfo(destinationAtas);

        recipients.forEach((recipient: { address: string, amount: number }, index: number) => {
            const destinationPublicKey = new PublicKey(recipient.address);
            const destinationAta = destinationAtas[index];
            const accountInfo = accountsInfo[index];

            // If the associated token account does not exist, create it
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

            // Create the transfer instruction
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
        console.error('Error in airdrop API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
