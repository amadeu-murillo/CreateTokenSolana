import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';
import { Liquidity, DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID, Market, TxVersion, Token, TokenAccount, SPL_ACCOUNT_LAYOUT } from '@raydium-io/raydium-sdk';
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from "bn.js";

// Função auxiliar para converter com segurança uma string decimal para sua menor unidade como uma string
function toSmallestUnit(amount: string, decimals: number): string {
    const safeAmount = String(amount).replace(/,/g, '.'); // Substitui vírgula por ponto
    if (!safeAmount || isNaN(Number(safeAmount))) {
        return '0';
    }
    const [integer, fraction = ''] = safeAmount.split('.');
    
    const formattedFraction = fraction.slice(0, decimals).padEnd(decimals, '0');
    
    const result = `${integer}${formattedFraction}`;

    return result.replace(/^0+/, '') || '0';
}

interface CreateLpRequest {
    wallet: string;
    baseMint: string;
    quoteMint: string;
    baseAmount: string; // Manter como string para precisão
    quoteAmount: string; // Manter como string para precisão
    marketId: string;
    baseDecimals: number;
}

export async function POST(request: Request) {
    try {
        const { wallet, baseMint, quoteMint, baseAmount, quoteAmount, marketId, baseDecimals }: CreateLpRequest = await request.json();

        if (!wallet || !baseMint || !quoteMint || !baseAmount || !quoteAmount || !marketId || baseDecimals === undefined) {
            return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(wallet);

        const quotePublicKey = new PublicKey(quoteMint);
        if (!quotePublicKey.equals(NATIVE_MINT)) {
            return NextResponse.json({ error: 'O token de cotação deve ser SOL para este endpoint.' }, { status: 400 });
        }
        
        // CORREÇÃO: Buscar as contas de token e fazer o PARSE dos dados para o formato que a Raydium SDK espera.
        const tokenAccounts = await connection.getTokenAccountsByOwner(userPublicKey, { programId: TOKEN_PROGRAM_ID });
        const walletTokenAccounts: TokenAccount[] = tokenAccounts.value.map(({ pubkey, account }) => ({
            pubkey,
            accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data), // AQUI ESTÁ A CORREÇÃO PRINCIPAL
            programId: TOKEN_PROGRAM_ID,
        }));
        
        const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMint), baseDecimals);
        const quoteToken = new Token(TOKEN_PROGRAM_ID, NATIVE_MINT, 9, 'SOL', 'SOL');
        
        const baseAmountInSmallestUnit = toSmallestUnit(baseAmount, baseToken.decimals);
        const quoteAmountInSmallestUnit = toSmallestUnit(quoteAmount, quoteToken.decimals);

        const { innerTransactions } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection,
            programId: DEVNET_PROGRAM_ID.AmmV4,
            marketInfo: {
                marketId: new PublicKey(marketId),
                programId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
            },
            baseMintInfo: baseToken,
            quoteMintInfo: quoteToken,
            baseAmount: new BN(baseAmountInSmallestUnit),
            quoteAmount: new BN(quoteAmountInSmallestUnit),
            startTime: new BN(Math.floor(Date.now() / 1000)),
            ownerInfo: {
                feePayer: userPublicKey,
                wallet: userPublicKey,
                tokenAccounts: walletTokenAccounts,
                useSOLBalance: true,
            },
            associatedOnly: true,
            checkCreateATAOwner: true,
            makeTxVersion: TxVersion.V0,
            feeDestinationId: new PublicKey("3XMrhbv989sVscFkcGGVBFepJgXw8aTFRY6kPYiZANzM"),
        });

        let allInstructions: TransactionInstruction[] = [];
        for (const tx of innerTransactions) {
            allInstructions.push(...tx.instructions);
        }

        const instructions: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            }),
            ...allInstructions
        ];

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        for (const tx of innerTransactions) {
            transaction.sign(tx.signers);
        }

        const serializedTransaction = transaction.serialize();
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

        return NextResponse.json({ transaction: base64Transaction });

    } catch (error) {
        console.error('Erro ao criar pool de liquidez:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao criar a transação.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

