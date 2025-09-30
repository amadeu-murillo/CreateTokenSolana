// src/app/api/create-raydium-pool/route.ts
import { NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { NATIVE_MINT, TOKEN_PROGRAM_ID, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  Token,
  Liquidity,
  MarketV2,
  DEVNET_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
  TxVersion,
  InnerSimpleV0Transaction,
} from '@raydium-io/raydium-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

// Determina os program IDs com base no ambiente (usando o RPC para decidir)
const isMainnet = RPC_ENDPOINT.includes('mainnet');
const RAYDIUM_LIQUIDITY_PROGRAM_ID = isMainnet ? MAINNET_PROGRAM_ID.AmmV4 : DEVNET_PROGRAM_ID.AmmV4;
const OPENBOOK_PROGRAM_ID = isMainnet ? MAINNET_PROGRAM_ID.OPENBOOK_MARKET : DEVNET_PROGRAM_ID.OPENBOOK_MARKET;

interface CreateRaydiumPoolRequest {
  wallet: string;
  baseMint: string;
  quoteMint: string; // Sempre será SOL
  baseAmount: string;
  quoteAmount: string;
  baseDecimals: number;
}

export async function POST(request: Request) {
  try {
    const {
      wallet,
      baseMint,
      baseAmount,
      quoteAmount,
      baseDecimals,
    }: CreateRaydiumPoolRequest = await request.json();

    if (!wallet || !baseMint || !baseAmount || !quoteAmount || baseDecimals === undefined) {
      return NextResponse.json({ error: 'Dados da requisição incompletos.' }, { status: 400 });
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const userPublicKey = new PublicKey(wallet);

    const baseToken = new Token(TOKEN_PROGRAM_ID, new PublicKey(baseMint), baseDecimals);
    const quoteToken = Token.WSOL;

    // CORREÇÃO: Usa a função principal para encontrar o endereço da conta de token associada.
    const [associatedTokenAccount] = PublicKey.findProgramAddressSync(
        [
            userPublicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            baseToken.mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );


    const tokenAccountInfo = await connection.getAccountInfo(associatedTokenAccount);
    if (!tokenAccountInfo) {
      return NextResponse.json({ error: 'Conta de token associada não encontrada para o mint fornecido.' }, { status: 400 });
    }
    
    const tokenAccounts = [{
      pubkey: associatedTokenAccount,
      programId: tokenAccountInfo.owner,
      accountInfo: AccountLayout.decode(tokenAccountInfo.data),
    }];


    // 1. Criar um Market ID para o par de tokens.
    const { innerTransactions: createMarketTransactions, address: marketAddress } =
      await MarketV2.makeCreateMarketInstructionSimple({
        connection,
        wallet: userPublicKey,
        baseInfo: baseToken,
        quoteInfo: quoteToken,
        lotSize: 1,
        tickSize: 0.01,
        dexProgramId: OPENBOOK_PROGRAM_ID,
        makeTxVersion: TxVersion.V0,
      });

    // 2. Após a criação do mercado, criar o pool de liquidez
    const { innerTransactions: createPoolTransactions } =
      await Liquidity.makeCreatePoolV4InstructionV2Simple({
        connection,
        programId: RAYDIUM_LIQUIDITY_PROGRAM_ID,
        marketInfo: {
          marketId: marketAddress.marketId,
          programId: OPENBOOK_PROGRAM_ID,
        },
        baseMintInfo: baseToken,
        quoteMintInfo: quoteToken,
        baseAmount: new BN(new Decimal(baseAmount).times(new Decimal(10).pow(baseDecimals)).toFixed(0)),
        quoteAmount: new BN(new Decimal(quoteAmount).times(new Decimal(10).pow(9)).toFixed(0)),
        startTime: new BN(Math.floor(Date.now() / 1000) - 5),
        ownerInfo: {
          feePayer: userPublicKey,
          wallet: userPublicKey,
          tokenAccounts: tokenAccounts, // Fornece a lista de contas
          useSOLBalance: true,
        },
        associatedOnly: true,
        checkCreateATAOwner: true,
        makeTxVersion: TxVersion.V0,
        feeDestinationId: DEV_WALLET_ADDRESS,
      });

    const allInnerTransactions = [...createMarketTransactions, ...createPoolTransactions];

    if (allInnerTransactions.length > 0) {
        allInnerTransactions[0].instructions.unshift(
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: DEV_WALLET_ADDRESS,
                lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
            }),
            ComputeBudgetProgram.setComputeUnitLimit({ units: 800000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 })
        );
    }
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    const transactions = allInnerTransactions.map((tx: InnerSimpleV0Transaction) => {
        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions: tx.instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        if (tx.signers.length > 0) {
            transaction.sign(tx.signers);
        }
        return Buffer.from(transaction.serialize()).toString('base64');
    });

    return NextResponse.json({
      transactions,
    });

  } catch (error) {
    console.error('Erro ao criar pool de liquidez na Raydium:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao criar a transação.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

