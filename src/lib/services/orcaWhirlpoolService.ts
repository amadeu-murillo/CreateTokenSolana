import {
    AnchorProvider,
    Wallet,
} from '@coral-xyz/anchor';
import {
    Percentage,
} from '@orca-so/common-sdk';
import {
    increaseLiquidityQuoteByInputToken,
    TickUtil,
    WhirlpoolContext,
    buildWhirlpoolClient,
    IGNORE_CACHE,
    WhirlpoolData,
} from '@orca-so/whirlpools-sdk';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    VersionedTransaction,
} from '@solana/web3.js';
import Decimal from 'decimal.js';

// Define o endereço de configuração dos Whirlpools para a devnet
const ORCA_WHIRLPOOLS_CONFIG = new PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR");

interface CreateLiquidityParams {
    provider: AnchorProvider;
    poolAddress: PublicKey;
    tokenMint: PublicKey;
    tokenAmount: number; // Alterado para number
    lowerPrice: number;  // Alterado para number
    upperPrice: number;  // Alterado para number
    user: PublicKey;
}

// Função para buscar dados de um pool específico
async function fetchPoolData(connection: Connection, poolAddress: PublicKey): Promise<WhirlpoolData | null> {
    // Uma carteira fictícia é suficiente para operações de apenas leitura.
    const dummyWallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async (tx: Transaction | VersionedTransaction) => tx,
        signAllTransactions: async (txs: (Transaction | VersionedTransaction)[]) => txs,
    };
    const ctx = WhirlpoolContext.from(connection, dummyWallet as Wallet, ORCA_WHIRLPOOLS_CONFIG);
    const client = buildWhirlpoolClient(ctx);
    
    try {
        const whirlpool = await client.getPool(poolAddress, IGNORE_CACHE);
        return whirlpool.getData();
    } catch (error) {
        console.error("Falha ao buscar dados do pool no serviço:", error);
        return null;
    }
}

async function createLiquidityPool(params: CreateLiquidityParams) {
    const { provider, poolAddress, tokenMint, tokenAmount, lowerPrice, upperPrice, user } = params;

    const ctx = WhirlpoolContext.from(provider.connection, provider.wallet, ORCA_WHIRLPOOLS_CONFIG);
    const client = buildWhirlpoolClient(ctx);
    
    const whirlpool = await client.getPool(poolAddress, IGNORE_CACHE);
    
    const whirlpoolData = whirlpool.getData();
    
    const inputTokenMint = tokenMint;
    
    if (!whirlpoolData.tokenMintA.equals(inputTokenMint) && !whirlpoolData.tokenMintB.equals(inputTokenMint)) {
        throw new Error("O token do pool não corresponde ao token de input.");
    }
    
    const tickSpacing = whirlpoolData.tickSpacing;
    
    const tickLowerIndex = TickUtil.getInitializableTickIndex(new Decimal(lowerPrice), tickSpacing);
    const tickUpperIndex = TickUtil.getInitializableTickIndex(new Decimal(upperPrice), tickSpacing);

    const quote = increaseLiquidityQuoteByInputToken(
        inputTokenMint,
        new Decimal(tokenAmount),
        tickLowerIndex,
        tickUpperIndex,
        Percentage.fromFraction(1, 100), // 1% de slippage
        whirlpool
    );

    const { positionMint, tx: openPositionTx } = await whirlpool.openPosition(
        tickLowerIndex,
        tickUpperIndex,
        quote,
        user,
        user
    );
    
    return {
        transaction: await openPositionTx.build({
            maxSupportedTransactionVersion: "legacy",
        }),
        positionMint: positionMint.toBase58()
    };
}

export const orcaWhirlpoolService = {
    createLiquidityPool,
    fetchPoolData,
};

