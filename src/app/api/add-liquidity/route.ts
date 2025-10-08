import { NextResponse } from 'next/server';
import { 
    Connection, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    TransactionInstruction, 
    ComputeBudgetProgram, 
    VersionedTransaction, 
    TransactionMessage,
    LAMPORTS_PER_SOL,
    Keypair
} from '@solana/web3.js';
import { NATIVE_MINT, getMint, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS, DLMM_PROGRAM_IDS } from '@/lib/constants';
import { BorshCoder, Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { IDL } from '@/lib/dlmm/idl'; // Assumindo que o IDL está disponível

// --- Tipos e Interfaces ---
interface AddLiquidityRequest {
    wallet: string;
    baseMint: string;
    quoteMint: string;
    baseAmount: number;
    quoteAmount: number;
    binStep: number;
}

// --- Funções Auxiliares Manuais ---

function getPriceAsNumber(price: BN, baseDecimals: number, quoteDecimals: number): number {
    const scale = new BN(10).pow(new BN(baseDecimals - quoteDecimals));
    return price.div(new BN(2).pow(new BN(64))).toNumber() / scale.toNumber();
}

function getBinIdFromPrice(price: number, binStep: number, roundingUp: boolean): number {
    const priceSqrt = Math.sqrt(price);
    const binId = Math.floor(Math.log(priceSqrt) / Math.log(1 + binStep / 10000));
    return roundingUp ? Math.ceil(binId) : Math.floor(binId);
}

function deriveLbPair(tokenXMint: PublicKey, tokenYMint: PublicKey, binStep: number, programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("lb_pair"),
            tokenXMint.toBuffer(),
            tokenYMint.toBuffer(),
            new BN(binStep).toBuffer("le", 2),
        ],
        programId
    );
}

// Função para criar as instruções de adição de liquidez manualmente
async function createAddLiquidityInstructions(
    program: Program<typeof IDL>,
    lbPairKey: PublicKey,
    positionKey: PublicKey,
    userPublicKey: PublicKey,
    baseAmountLamports: BN,
    quoteAmountLamports: BN,
    activeBinId: number,
    baseDecimals: number,
    quoteDecimals: number
): Promise<{ instructions: TransactionInstruction[], positionKeypair: Keypair }> {
    
    const positionKeypair = Keypair.generate();
    const positionState = await program.account.position.getPda(positionKeypair.publicKey);

    const accounts = {
        lbPair: lbPairKey,
        owner: userPublicKey,
        position: positionState.publicKey,
    };

    const addLiquidityParams = {
        liquidityParameters: {
            amountX: baseAmountLamports,
            amountY: quoteAmountLamports,
            // Liquidity distribution for a single bin
            binLiquidityDist: [{
                binId: activeBinId,
                distributionX: 100, // 100% of base tokens
                distributionY: 100, // 100% of quote tokens
            }]
        }
    };
    
    const initializePositionIx = await program.methods
        .initializePosition(new BN(0)) // index 0 for the position array
        .accounts({
            ...accounts,
            payer: userPublicKey,
            positionMint: positionKeypair.publicKey,
        })
        .instruction();

    const addLiquidityIx = await program.methods
        .addLiquidity(addLiquidityParams)
        .accounts(accounts)
        .instruction();

    return {
        instructions: [initializePositionIx, addLiquidityIx],
        positionKeypair: positionKeypair,
    };
}


export async function POST(request: Request) {
    try {
        const { wallet, baseMint, quoteMint, baseAmount, quoteAmount, binStep }: AddLiquidityRequest = await request.json();

        if (!wallet || !baseMint || !quoteMint || !baseAmount || !quoteAmount || !binStep) {
            return NextResponse.json({ error: 'Dados incompletos fornecidos.' }, { status: 400 });
        }

        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const userPublicKey = new PublicKey(wallet);
        const baseMintPK = new PublicKey(baseMint);
        const quoteMintPK = new PublicKey(quoteMint);

        const [baseMintInfo, quoteMintInfo] = await Promise.all([
            getMint(connection, baseMintPK),
            getMint(connection, quoteMintPK)
        ]);
        const baseDecimals = baseMintInfo.decimals;
        const quoteDecimals = quoteMintInfo.decimals;

        const baseAmountLamports = new BN(baseAmount * (10 ** baseDecimals));
        const quoteAmountLamports = new BN(quoteAmount * (10 ** quoteDecimals));
        
        const initialPrice = quoteAmount / baseAmount;
        const activeBinId = getBinIdFromPrice(initialPrice, binStep, false);
        
        const dlmmProgramId = new PublicKey(DLMM_PROGRAM_IDS['devnet']);
        const [lbPairKey] = deriveLbPair(baseMintPK, quoteMintPK, binStep, dlmmProgramId);

        const lbPairAccount = await connection.getAccountInfo(lbPairKey);

        const instructions: TransactionInstruction[] = [
            ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS
            }),
        ];

        // Configuração do Anchor Provider para interagir com o programa
        const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), { commitment: 'confirmed' });
        const program = new Program<typeof IDL>(IDL, dlmmProgramId, provider);

        // 1. Criar o Pool se ele não existir (instrução manual)
        if (!lbPairAccount) {
            const initializeLbPairIx = await program.methods
                .initializeLbPair(activeBinId, binStep)
                .accounts({
                    lbPair: lbPairKey,
                    reserveX: PublicKey.findProgramAddressSync([lbPairKey.toBuffer(), baseMintPK.toBuffer()], dlmmProgramId)[0],
                    reserveY: PublicKey.findProgramAddressSync([lbPairKey.toBuffer(), quoteMintPK.toBuffer()], dlmmProgramId)[0],
                    tokenXMint: baseMintPK,
                    tokenYMint: quoteMintPK,
                    feeDistributor: userPublicKey, // Temporário, pode ser outro
                    admin: userPublicKey,
                    funder: userPublicKey,
                })
                .instruction();
            instructions.push(initializeLbPairIx);
        }

        // 2. Adicionar liquidez
        const { instructions: addLiquidityIxs, positionKeypair } = await createAddLiquidityInstructions(
            program,
            lbPairKey,
            Keypair.generate().publicKey,
            userPublicKey,
            baseAmountLamports,
            quoteAmountLamports,
            activeBinId,
            baseDecimals,
            quoteDecimals
        );
        instructions.push(...addLiquidityIxs);
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        // A transação NÃO é assinada aqui no backend com o positionKeypair
        // A chave secreta é enviada para o frontend para ser usada como co-signer.
        
        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
        const positionSecretKey = JSON.stringify(Array.from(positionKeypair.secretKey));


        return NextResponse.json({
            transaction: serializedTransaction,
            poolAddress: lbPairKey.toBase58(),
            positionSecretKey: positionSecretKey,
        });

    } catch (error) {
        console.error('Erro na API /api/add-liquidity:', error);
        let errorMessage = 'Erro interno do servidor ao criar o pool de liquidez.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}





