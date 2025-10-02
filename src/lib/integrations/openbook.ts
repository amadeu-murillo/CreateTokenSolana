// src/lib/integrations/openbook.ts

import {
  Connection,
  PublicKey,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
  Keypair,
  TransactionInstruction, // <-- ADIÇÃO: Importar o tipo TransactionInstruction
  Signer, // <-- ADIÇÃO: Importar o tipo Signer
} from '@solana/web3.js';
import {
  MAINNET_PROGRAM_ID,
  MarketV2,
  Token,
} from '@raydium-io/raydium-sdk';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { RPC_ENDPOINT } from '@/lib/constants';
import { CreateMarketParams } from '@/types/api';
import bs58 from 'bs58';

class OpenbookIntegration {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  /**
   * Constrói a transação para criar um novo mercado no OpenBook.
   * Este mercado é necessário antes de criar um pool de liquidez na Raydium AMM v4.
   */
  async buildCreateMarketTransaction(params: CreateMarketParams) {
    const {
      baseTokenMint,
      baseTokenDecimals,
      quoteTokenMint,
      quoteTokenDecimals,
      userWalletAddress,
    } = params;

    const userPublicKey = new PublicKey(userWalletAddress);

    const baseToken = new Token(
      TOKEN_PROGRAM_ID,
      new PublicKey(baseTokenMint),
      baseTokenDecimals
    );
    
    const quoteToken = new Token(
      TOKEN_PROGRAM_ID,
      new PublicKey(quoteTokenMint),
      quoteTokenDecimals
    );

    // --- MUDANÇA: Processar a nova estrutura de retorno ---
    const createMarketResult =
      await MarketV2.makeCreateMarketInstructionSimple({
        connection: this.connection,
        wallet: userPublicKey,
        baseInfo: baseToken,
        quoteInfo: quoteToken,
        lotSize: 1, 
        tickSize: 0.01,
        dexProgramId: MAINNET_PROGRAM_ID.OPENBOOK_MARKET,
        makeTxVersion: 0,
      });
    
    // Extrair os dados da nova estrutura
    const marketId = createMarketResult.address.marketId;
    const allInstructions: TransactionInstruction[] = [];
    const allSigners: Signer[] = [];

    // Iterar sobre as transações internas para coletar instruções e signatários
    for (const tx of createMarketResult.innerTransactions) {
      allInstructions.push(...tx.instructions);
      allSigners.push(...(tx.signers || []));
    }
      
    const finalInstructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 25_000 }),
        ...allInstructions,
    ];

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    const messageV0 = new TransactionMessage({
      payerKey: userPublicKey,
      recentBlockhash: blockhash,
      instructions: finalInstructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // Adicionar todos os signatários coletados
    if (allSigners.length > 0) {
      transaction.sign(allSigners);
    }

    const serializedTransaction = bs58.encode(transaction.serialize());

    return {
      transaction: serializedTransaction,
      marketId: marketId.toBase58(),
    };
  }
}

export const openbookIntegration = new OpenbookIntegration();