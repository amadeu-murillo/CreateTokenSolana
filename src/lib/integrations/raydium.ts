// src/lib/integrations/raydium.ts

import {
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import {
  Liquidity,
  Token,
  TokenAmount,
  Percent,
  LiquidityPoolKeys,
  MAINNET_PROGRAM_ID,
  LiquidityPoolInfo,
} from '@raydium-io/raydium-sdk';
import { RPC_ENDPOINT } from '@/lib/constants';
import { CreatePoolWithSolParams } from '@/types/api';
import bs58 from 'bs58';

class RaydiumIntegration {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  /**
   * Constrói a transação para criar um novo pool de liquidez na Raydium
   * usando o programa AMM v4 (Constant Product).
   */
  async buildCreatePoolWithSolTransaction(params: CreatePoolWithSolParams) {
    const {
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      userWalletAddress,
    } = params;

    const userPublicKey = new PublicKey(userWalletAddress);
    const baseMint = new PublicKey(baseTokenMint);
    const quoteMint = NATIVE_MINT; // WSOL

    const baseToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseTokenDecimals);
    const quoteToken = new Token(TOKEN_PROGRAM_ID, quoteMint, 9, 'WSOL', 'Wrapped SOL');

    // ---- 1. Gerar chaves e endereços para o novo pool ----
    // O SDK da Raydium calcula deterministicamente os endereços das contas do pool
    const { authority, marketId, lpMint, ...poolKeys } = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3, // OpenBook market version
        baseMint,
        quoteMint,
        baseDecimals: baseTokenDecimals,
        quoteDecimals: 9,
        programId: MAINNET_PROGRAM_ID.AmmV4,
        marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET, // OpenBook program id
    });

    const poolInfo: LiquidityPoolInfo = {
        baseDecimals: baseTokenDecimals,
        quoteDecimals: 9,
        lpDecimals: baseTokenDecimals,
        lpSupply: BigInt(0),
        startTime: BigInt(Math.floor(Date.now() / 1000)), // Iniciar agora
        pnl: [0, 0],
        // Valores padrão para um novo pool
        status: 0,
        minOrderSize: 0,
        baseReserve: BigInt(0),
        quoteReserve: BigInt(0),
    };
    
    // ---- 2. Construir as instruções ----
    const instructions = [];

    // Otimização de taxas
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }));

    // Conta temporária de WSOL para depositar a liquidez de SOL
    const wrappedSolAccount = Keypair.generate();
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports: await this.connection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: wrappedSolAccount.publicKey,
        lamports: Math.ceil(initialSolAmount * LAMPORTS_PER_SOL),
      }),
      createSyncNativeInstruction(wrappedSolAccount.publicKey)
    );
    
    // Instrução para criar e inicializar o pool
    const initPoolInstruction = Liquidity.makeCreatePoolV4Instruction({
        poolKeys: { authority, marketId, lpMint, ...poolKeys },
        userKeys: {
            payer: userPublicKey,
            tokenAccounts: [], // Será preenchido pelo SDK
        },
        associatedPoolKeys: poolKeys,
        startTime: poolInfo.startTime,
    });
    instructions.push(initPoolInstruction);


    // Instrução para adicionar a liquidez inicial
    const baseTokenAmount = new TokenAmount(baseToken, initialBaseTokenAmount, true);
    const quoteTokenAmount = new TokenAmount(quoteToken, initialSolAmount, true);

    const userTokenAccount = getAssociatedTokenAddressSync(baseMint, userPublicKey);

    const addLiqInstruction = Liquidity.makeAddLiquidityInstruction({
        poolKeys: { authority, marketId, lpMint, ...poolKeys },
        userKeys: {
            owner: userPublicKey,
            payer: userPublicKey,
            tokenAccounts: [
                { account: userTokenAccount, mint: baseMint },
                { account: wrappedSolAccount.publicKey, mint: quoteMint },
            ],
        },
    }, {
        baseAmount: BigInt(baseTokenAmount.raw.toString()),
        quoteAmount: BigInt(quoteTokenAmount.raw.toString()),
        fixedSide: 'base',
    }).instruction;
    instructions.push(addLiqInstruction);
    
    // Fechar a conta temporária de WSOL
    instructions.push(
      createCloseAccountInstruction(wrappedSolAccount.publicKey, userPublicKey, userPublicKey)
    );

    // ---- 3. Compilar e serializar a transação ----
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    // A conta de WSOL precisa assinar a transação
    transaction.sign([wrappedSolAccount]);

    const serializedTransaction = bs58.encode(transaction.serialize());

    return {
      transaction: serializedTransaction,
      ammId: poolKeys.id.toBase58(),
      lpTokenAddress: lpMint.toBase58(),
    };
  }
}

export const raydiumIntegration = new RaydiumIntegration();