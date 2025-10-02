import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
  MINT_SIZE,
  createInitializeMintInstruction,
} from '@solana/spl-token';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { IDL, type Amm } from '@/lib/idl/amm';
import { CreatePoolWithSolParams } from '@/types/api';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

const PROGRAM_ID = new PublicKey(IDL.metadata.address);

// Helper para criar uma carteira "dummy" que satisfaz a interface do AnchorProvider
const createDummyWallet = (): Wallet => {
  const payer = Keypair.generate();
  return {
    payer,
    publicKey: payer.publicKey,
    signTransaction: <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      throw new Error("DummyWallet não pode assinar transações. A transação deve ser assinada no lado do cliente.");
    },
    signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      throw new Error("DummyWallet não pode assinar transações. As transações devem ser assinadas no lado do cliente.");
    },
  };
};


class CustomAmmService {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<Amm>;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const dummyWallet = createDummyWallet();
    this.provider = new AnchorProvider(this.connection, dummyWallet, { commitment: 'confirmed' });
    this.program = new Program<Amm>(IDL, PROGRAM_ID, this.provider);
  }

  async createPoolAndAddLiquidity(params: CreatePoolWithSolParams) {
    console.log("Iniciando createPoolAndAddLiquidity com os parâmetros:", params);
    try {
        const {
        baseTokenMint,
        initialBaseTokenAmount,
        initialSolAmount,
        userWalletAddress,
        baseTokenDecimals,
        } = params;

        const userPublicKey = new PublicKey(userWalletAddress);
        const baseMint = new PublicKey(baseTokenMint);
        const quoteMint = NATIVE_MINT; // WSOL

        const poolKeypair = Keypair.generate();
        const lpMintKeypair = Keypair.generate();
        const vaultAKeypair = Keypair.generate();
        const vaultBKeypair = Keypair.generate();
        const wrappedSolAccount = Keypair.generate();

        console.log("Chaves geradas:", {
            pool: poolKeypair.publicKey.toBase58(),
            lpMint: lpMintKeypair.publicKey.toBase58(),
            vaultA: vaultAKeypair.publicKey.toBase58(),
            vaultB: vaultBKeypair.publicKey.toBase58(),
        });

        const [poolAuthority] = PublicKey.findProgramAddressSync(
        [poolKeypair.publicKey.toBuffer()],
        this.program.programId
        );
        console.log("PDA da pool authority derivado:", poolAuthority.toBase58());

        const userTokenA = getAssociatedTokenAddressSync(baseMint, userPublicKey);
        const userLpToken = getAssociatedTokenAddressSync(lpMintKeypair.publicKey, userPublicKey);

        const instructions = [];

        // Adiciona a instrução de transferência da taxa de serviço
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: DEV_WALLET_ADDRESS,
            lamports: SERVICE_FEE_CREATE_LP_LAMPORTS,
          })
        );

        // 1. Create temporary account for WSOL
        console.log("A preparar instruções para a conta WSOL temporária...");
        const rentForWrappedSol = await this.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
        instructions.push(
          SystemProgram.createAccount({
              fromPubkey: userPublicKey,
              newAccountPubkey: wrappedSolAccount.publicKey,
              lamports: rentForWrappedSol,
              space: ACCOUNT_SIZE,
              programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeAccountInstruction(wrappedSolAccount.publicKey, quoteMint, userPublicKey, TOKEN_PROGRAM_ID),
          SystemProgram.transfer({
              fromPubkey: userPublicKey,
              toPubkey: wrappedSolAccount.publicKey,
              lamports: Math.ceil(initialSolAmount * LAMPORTS_PER_SOL),
          }),
          createSyncNativeInstruction(wrappedSolAccount.publicKey)
        );
        console.log("Instruções WSOL adicionadas.");

        // Obter o tamanho da conta do pool a partir do programa Anchor
        const poolAccountSize = this.program.account.Pool.size;
        const rentForPool = await this.connection.getMinimumBalanceForRentExemption(poolAccountSize);
        const rentForMint = await this.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        const rentForTokenAccount = await this.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);

        instructions.push(
          // Criar a conta principal do Pool
          SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: poolKeypair.publicKey,
            lamports: rentForPool,
            space: poolAccountSize,
            programId: this.program.programId,
          }),
          // Criar a conta do LP Mint
          SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: lpMintKeypair.publicKey,
            lamports: rentForMint,
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeMintInstruction(lpMintKeypair.publicKey, 9, poolAuthority, null, TOKEN_PROGRAM_ID),
          // Criar a conta do Vault A
          SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: vaultAKeypair.publicKey,
            lamports: rentForTokenAccount,
            space: ACCOUNT_SIZE,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeAccountInstruction(vaultAKeypair.publicKey, baseMint, poolAuthority, TOKEN_PROGRAM_ID),
          // Criar a conta do Vault B
          SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: vaultBKeypair.publicKey,
            lamports: rentForTokenAccount,
            space: ACCOUNT_SIZE,
            programId: TOKEN_PROGRAM_ID,
          }),
          createInitializeAccountInstruction(vaultBKeypair.publicKey, quoteMint, poolAuthority, TOKEN_PROGRAM_ID)
        );

        // 2. Create user's ATA for the LP token if it doesn't exist
        console.log("A verificar a conta de token LP do utilizador...");
        const userLpTokenAccountInfo = await this.connection.getAccountInfo(userLpToken);
        if (userLpTokenAccountInfo === null) {
        console.log("Conta de token LP não encontrada. A adicionar instrução para criar.");
        instructions.push(
            createAssociatedTokenAccountInstruction(userPublicKey, userLpToken, userPublicKey, lpMintKeypair.publicKey)
        );
        } else {
            console.log("Conta de token LP do utilizador já existe.");
        }
        
        // 3. Instruction to initialize the pool (from our program Anchor)
        console.log("A construir a instrução initializePool...");
        const initPoolIx = await this.program.methods
            .initializePool(100) // Taxa de 1% (100 basis points)
            .accounts({
                pool: poolKeypair.publicKey,
                poolAuthority: poolAuthority,
                mintA: baseMint,
                mintB: quoteMint,
                vaultA: vaultAKeypair.publicKey,
                vaultB: vaultBKeypair.publicKey,
                lpMint: lpMintKeypair.publicKey,
                payer: userPublicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            })
            .instruction();
        
        instructions.push(initPoolIx);
        console.log("Instrução initializePool construída com sucesso.");

        // 4. Instruction to add initial liquidity
        console.log("A construir a instrução addLiquidity...");
        const addLiquidityIx = await this.program.methods
            .addLiquidity(new BN(Math.round(initialBaseTokenAmount * Math.pow(10, baseTokenDecimals))), new BN(Math.round(initialSolAmount * LAMPORTS_PER_SOL)))
            .accounts({
                pool: poolKeypair.publicKey,
                lpMint: lpMintKeypair.publicKey,
                vaultA: vaultAKeypair.publicKey,
                vaultB: vaultBKeypair.publicKey,
                userTokenA: userTokenA,
                userTokenB: wrappedSolAccount.publicKey,
                userLpToken: userLpToken,
                poolAuthority: poolAuthority,
                user: userPublicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();
        instructions.push(addLiquidityIx);
        console.log("Instrução addLiquidity construída com sucesso.");

        // 5. Close the temporary WSOL account
        instructions.push(
        createCloseAccountInstruction(wrappedSolAccount.publicKey, userPublicKey, userPublicKey)
        );
        console.log("Instrução para fechar a conta WSOL adicionada.");

        const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
        console.log("Blockhash recente obtido:", blockhash);

        const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);

        // Sign with the newly generated accounts
        console.log("A assinar a transação com as contas geradas...");
        transaction.sign([poolKeypair, vaultAKeypair, vaultBKeypair, lpMintKeypair, wrappedSolAccount]);

        const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
        console.log("Transação serializada com sucesso.");

        return {
        transaction: serializedTransaction,
        ammId: poolKeypair.publicKey.toBase58(),
        lpTokenAddress: lpMintKeypair.publicKey.toBase58(),
        };
    } catch (error) {
        console.error("ERRO DETALHADO em createPoolAndAddLiquidity:", error);
        // Lança o erro para que a rota da API possa capturá-lo e retornar uma resposta 500
        throw error;
    }
  }
}

export const customAmmService = new CustomAmmService();

