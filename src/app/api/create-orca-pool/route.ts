// src/app/api/create-orca-pool/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, Transaction } from '@solana/web3.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';
import { NATIVE_MINT } from '@solana/spl-token';
import { OrcaU64, ORCA_WHIRLPOOL_PROGRAM_ID, WhirlpoolContext, buildWhirlpoolClient, PriceMath } from '@orca-so/sdk';
import Decimal from 'decimal.js';

// ADICIONADO: Interface mínima para a carteira para evitar a importação direta do Anchor
interface MinimalWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

interface CreateOrcaPoolRequest {
    wallet: string;
    baseMint: string;
    quoteMint: string;
    baseAmount: string;
    quoteAmount: string;
    baseDecimals: number;
}


export async function POST(request: Request) {
    try {
        const { wallet, baseMint, baseAmount, quoteAmount, baseDecimals }: CreateOrcaPoolRequest = await request.json();

        if (!wallet || !baseMint || !baseAmount || !quoteAmount || baseDecimals === undefined) {
            return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(wallet);
        
        // A SDK da Orca precisa de um objeto Wallet, mas só a chave pública é usada para transações do frontend.
        const dummyWallet: MinimalWallet = { // Usando a interface mínima
            publicKey: userPublicKey,
            signTransaction: async (tx: any) => tx,
            signAllTransactions: async (txs: any[]) => txs,
        };

        const ctx = WhirlpoolContext.withProvider(dummyWallet, connection, ORCA_WHIRLPOOL_PROGRAM_ID);
        const client = buildWhirlpoolClient(ctx);
        
        const tokenAMint = new PublicKey(baseMint);
        const tokenBMint = NATIVE_MINT; // SOL

        // Calcular o preço inicial a partir das quantidades
        const amountA = new Decimal(baseAmount);
        const amountB = new Decimal(quoteAmount);
        const price = amountB.div(amountA);
        
        const sqrtPrice = PriceMath.decimalToSqrtPriceX64(price, baseDecimals, 9); // 9 decimais para SOL

        // Taxa do pool - 0.30% é um padrão comum
        const feeRate = 3000;
        // Espaçamento entre ticks - 64 é o mais comum
        const tickSpacing = 64; 

        // Criar o pool
        const createPoolTx = await client.createPool(
            tokenAMint,
            tokenBMint,
            tickSpacing,
            feeRate,
            sqrtPrice,
            userPublicKey
        );

        const whirlpoolAddress = createPoolTx.whirlpoolAddress;
        
        // Adicionar liquidez (abrir posição)
        const whirlpool = await client.getPool(whirlpoolAddress);

        const lowerPrice = price.mul(0.5);
        const upperPrice = price.mul(1.5);
        
        const tickLowerIndex = PriceMath.priceToTickIndex(lowerPrice, tickSpacing);
        const tickUpperIndex = PriceMath.priceToTickIndex(upperPrice, tickSpacing);

        const positionTx = await whirlpool.openPosition(
            tickLowerIndex,
            tickUpperIndex,
            {
                // Quantidade do token base
                tokenMaxA: new OrcaU64(amountA.mul(10**baseDecimals).toString()), 
                // Quantidade de SOL
                tokenMaxB: new OrcaU64(amountB.mul(10**9).toString()),
            }
        );
        
        // Compilar todas as transações
        const createPoolBuilder = createPoolTx.tx;
        const positionBuilder = positionTx.tx;

        const instructions = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
             SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            }),
            ...createPoolBuilder.instructions,
            ...positionBuilder.instructions
        ];

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        
        // Assinar com os Keypairs gerados pela SDK
        transaction.sign(createPoolBuilder.signers);
        transaction.sign(positionBuilder.signers);

        const serializedTransaction = transaction.serialize();
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

        return NextResponse.json({ 
            transaction: base64Transaction,
            poolId: whirlpoolAddress.toBase58() 
        });

    } catch (error) {
        console.error('Erro ao criar pool de liquidez Orca:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao criar a transação.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

