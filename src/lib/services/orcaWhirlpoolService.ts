import {
    Address,
    BN,
    Wallet,
} from '@coral-xyz/anchor';
import {
    AddressUtil,
    DecimalUtil,
    Percentage,
    TokenUtil,
    TransactionBuilder,
    ZERO,
} from '@orca-so/common-sdk';
import {
    PriceMath,
    WhirlpoolIx,
    increaseLiquidityQuoteByInputTokenWithParams,
} from '@orca-so/whirlpools';
import {
    WhirlpoolContext,
    buildWhirlpoolClient,
    IGNORE_CACHE,
} from '@orca-so/whirlpool-sdk';
import {
    Connection,
    PublicKey,
    Signer,
    Transaction,
} from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';
import Decimal from 'decimal.js';

// Função para criar um pool de liquidez (abrir uma posição)
export async function createLiquidityPool(
    connection: Connection,
    wallet: Wallet,
    tokenMint: string,
    tokenDecimals: number,
    tokenAmount: number,
    solAmount: number
) {
    const ctx = WhirlpoolContext.withProvider(
        { connection, wallet },
        new PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"), // Endereço do programa Whirlpool na devnet
    );
    const client = buildWhirlpoolClient(ctx);

    const tokenAMint = new PublicKey(tokenMint);
    const tokenBMint = NATIVE_MINT; // SOL

    // Encontra o pool para o par de tokens
    const whirlpool = await client.getPool(tokenAMint, tokenBMint);
    if (!whirlpool) {
        throw new Error("Pool não encontrado para este par de tokens.");
    }

    const whirlpoolData = await whirlpool.getData();
    const tickSpacing = whirlpoolData.tickSpacing;
    const currentPrice = PriceMath.sqrtPriceX64ToPrice(whirlpoolData.sqrtPrice, tokenAMint, tokenBMint);

    // Definir a faixa de preço (range) para a liquidez concentrada
    // Exemplo: 20% acima e abaixo do preço atual
    const lowerPrice = currentPrice.mul(new Decimal(0.8));
    const upperPrice = currentPrice.mul(new Decimal(1.2));

    const lowerTick = PriceMath.priceToTickIndex(lowerPrice, tokenDecimals, 9, tickSpacing);
    const upperTick = PriceMath.priceToTickIndex(upperPrice, tokenDecimals, 9, tickSpacing);

    // Obter a cotação para adicionar liquidez
    const quote = increaseLiquidityQuoteByInputTokenWithParams({
        tokenMintA: tokenAMint,
        tokenMintB: tokenBMint,
        sqrtPrice: whirlpoolData.sqrtPrice,
        tickCurrentIndex: whirlpoolData.tickCurrentIndex,
        tickLowerIndex: lowerTick,
        tickUpperIndex: upperTick,
        inputTokenMint: tokenAMint,
        inputTokenAmount: new BN(tokenAmount * (10 ** tokenDecimals)),
        slippageTolerance: Percentage.fromFraction(1, 100), // 1%
        refresh: true, // Força a busca de dados on-chain
        ctx,
    });

    // Construir a transação
    const openPositionTx = await whirlpool.openPosition(
        lowerTick,
        upperTick,
        quote,
        wallet.publicKey,
        wallet.publicKey
    );

    // Retorna a transação para ser assinada pelo usuário no frontend
    return openPositionTx.build({
        maxSupportedTransactionVersion: "legacy",
    });
}

