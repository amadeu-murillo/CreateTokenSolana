import {
    Connection,
    PublicKey,
    SystemProgram,
    VersionedTransaction,
    TransactionMessage,
    ComputeBudgetProgram,
    Keypair,
} from '@solana/web3.js';
import {
    DEV_WALLET_ADDRESS,
    RPC_ENDPOINT,
    SERVICE_FEE_CREATE_LP_LAMPORTS,
} from '@/lib/constants';
import { NATIVE_MINT, getAssociatedTokenAddress, createSyncNativeInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// @ts-ignore
import MeteoraSDK from '@meteora-ag/dlmm-sdk';
import BN from 'bn.js';

interface CreatePoolParams {
    baseTokenMint: string;
    baseTokenDecimals: number;
    initialBaseTokenAmount: number;
    initialSolAmount: number;
    userWalletAddress: string;
}

export async function createMeteoraPoolAndAddLiquidity(params: CreatePoolParams): Promise<{ transaction: string; poolAddress: string }> {
    const {
        baseTokenMint,
        baseTokenDecimals,
        initialBaseTokenAmount,
        initialSolAmount,
        userWalletAddress,
    } = params;

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(userWalletAddress);

    const tokenAMint = new PublicKey(baseTokenMint);
    const tokenBMint = NATIVE_MINT; // WSOL

    const amountA = new BN(initialBaseTokenAmount * (10 ** baseTokenDecimals));
    const amountB = new BN(initialSolAmount * (10 ** 9));

    const binStep = 25; // This is a common binStep for many pairs.
    
    // Price is quoted as TokenB per TokenA. In our case, SOL per your token.
    const initialPrice = MeteoraSDK.PriceMath.priceToBinId(
        Number(initialSolAmount) / Number(initialBaseTokenAmount),
        binStep,
    );

    const dlmm = new MeteoraSDK.DLMM(connection);

    // 1. Get transaction builder for creating the LbPair account
    const createPoolTxBuilder = await dlmm.createLbPair(
        tokenAMint,
        tokenBMint,
        initialPrice,
        binStep,
        userPublicKey,
    );

    const lbPair = createPoolTxBuilder.lbPair;

    // 2. Prepare instructions to add initial liquidity
    const userTokenAAccount = await getAssociatedTokenAddress(tokenAMint, userPublicKey);
    const userTokenBAccount = await getAssociatedTokenAddress(tokenBMint, userPublicKey);

    // Instructions to wrap SOL into WSOL for the pool
    const wsolInstructions = [
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: userTokenBAccount,
            lamports: amountB.toNumber(),
        }),
        createSyncNativeInstruction(userTokenBAccount, TOKEN_PROGRAM_ID)
    ];

    const lbPairState = await MeteoraSDK.LbPair.getLbPair(lbPair, connection);
    const lbPairInstance = new MeteoraSDK.LbPair(lbPairState);

    // Define the shape of the liquidity to be added
    const liquidityShape = {
        amountA: amountA,
        amountB: amountB,
        activeBin: initialPrice,
        binRange: 10, // Deposit liquidity across 10 bins on each side
    };

    const addLiquidityTxBuilder = await lbPairInstance.addLiquidityByRange(
        userPublicKey,
        liquidityShape
    );

    // 3. Combine all instructions into one transaction
    const allInstructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
        ...createPoolTxBuilder.transaction.instructions,
        ...wsolInstructions,
        ...addLiquidityTxBuilder.instructions,
        SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
        })
    ];

    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions: allInstructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // The backend signs with keypairs it generated (e.g., the new pool account)
    const signers = [createPoolTxBuilder.lbPairKeypair, ...addLiquidityTxBuilder.signers];
    transaction.sign(signers);

    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    return {
        transaction: serializedTransaction,
        poolAddress: lbPair.toBase58(),
    };
}

