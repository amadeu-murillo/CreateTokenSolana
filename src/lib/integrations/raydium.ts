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
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import {
  Liquidity,
  MAINNET_PROGRAM_ID,
  LiquidityPoolInfo,
  LiquidityPoolKeysV4,
  Market,
} from '@raydium-io/raydium-sdk';
import { RPC_ENDPOINT } from '@/lib/constants';
import { CreatePoolWithSolParams } from '@/types/api';
import bs58 from 'bs58';
import BN from 'bn.js';

class RaydiumIntegration {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  async buildCreatePoolWithSolTransaction(params: CreatePoolWithSolParams) {
    const {
      marketId: marketIdString,
      baseTokenMint,
      baseTokenDecimals,
      initialBaseTokenAmount,
      initialSolAmount,
      userWalletAddress,
    } = params;
    
    const marketId = new PublicKey(marketIdString);
    const userPublicKey = new PublicKey(userWalletAddress);
    const baseMint = new PublicKey(baseTokenMint);

    // ETAPA 1: Carregar todas as chaves necessárias do mercado
    const marketInfo = await this.connection.getAccountInfo(marketId);
    if (!marketInfo) throw new Error('Market not found.');
    const marketState = Market.getLayouts(3).state.decode(marketInfo.data);

    // ETAPA 2: Gerar as chaves associadas ao pool
    const associatedPoolKeys = Liquidity.getAssociatedPoolKeys({
      version: 4,
      marketVersion: 3,
      marketId,
      baseMint,
      quoteMint: NATIVE_MINT,
      baseDecimals: baseTokenDecimals,
      quoteDecimals: 9,
      programId: MAINNET_PROGRAM_ID.AmmV4,
      marketProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
    });
    
    // ETAPA 3: Construir o objeto 'poolKeys' completo
    const poolKeys: LiquidityPoolKeysV4 = {
      ...associatedPoolKeys,
      marketBaseVault: marketState.baseVault,
      marketQuoteVault: marketState.quoteVault,
      marketBids: marketState.bids,
      marketAsks: marketState.asks,
      marketEventQueue: marketState.eventQueue,
    };

    const poolInfo: LiquidityPoolInfo = {
      startTime: new BN(Math.floor(Date.now() / 1000)),
      baseDecimals: baseTokenDecimals,
      quoteDecimals: 9,
      lpDecimals: baseTokenDecimals,
      lpSupply: new BN(0),
      status: new BN(0),
      baseReserve: new BN(0),
      quoteReserve: new BN(0),
    };
    
    const instructions: TransactionInstruction[] = [];
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }));
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));

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
    
    // ETAPA 4: Corrigir a chamada de criação do pool
    const { instruction: initPoolInstruction } = Liquidity.makeCreatePoolV4InstructionV2({
      poolKeys,
      userKeys: { payer: userPublicKey },
      poolInfo,
    });
    instructions.push(initPoolInstruction);
    
    const userBaseTokenAccount = getAssociatedTokenAddressSync(baseMint, userPublicKey);
    const lpTokenAccount = getAssociatedTokenAddressSync(poolKeys.lpMint, userPublicKey);
    
    // Adicionar instrução para criar a conta de token LP, se necessário
    instructions.push(
        createAssociatedTokenAccountInstruction(
            userPublicKey, // payer
            lpTokenAccount, // ata
            userPublicKey, // owner
            poolKeys.lpMint // mint
        )
    );


    // ETAPA 5: Corrigir a chamada de adição de liquidez
    const { innerTransaction } = Liquidity.makeAddLiquidityInstructionV2({
      poolKeys,
      userKeys: {
        owner: userPublicKey,
        baseTokenAccount: userBaseTokenAccount,
        quoteTokenAccount: wrappedSolAccount.publicKey,
        lpTokenAccount: lpTokenAccount,
      },
      baseAmount: new BN(initialBaseTokenAmount * (10 ** baseTokenDecimals)),
      quoteAmount: new BN(initialSolAmount * (10 ** 9)),
      fixedSide: 'base',
    });
    instructions.push(...innerTransaction.instructions);
    
    instructions.push(
      createCloseAccountInstruction(wrappedSolAccount.publicKey, userPublicKey, userPublicKey)
    );

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([wrappedSolAccount]);

    const serializedTransaction = bs58.encode(transaction.serialize());

    return {
      transaction: serializedTransaction,
      ammId: associatedPoolKeys.id.toBase58(),
      lpTokenAddress: associatedPoolKeys.lpMint.toBase58(),
    };
  }
}

export const raydiumIntegration = new RaydiumIntegration();

