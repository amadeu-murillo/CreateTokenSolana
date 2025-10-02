import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
  getMinimumBalanceForRentExemptAccount,
  ACCOUNT_SIZE,
  createInitializeAccountInstruction,
} from '@solana/spl-token';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import AmmIDL from "@/lib/idl/amm.json";
import { CreatePoolWithSolParams } from '@/types/api';
import { RPC_ENDPOINT } from '@/lib/constants';

const PROGRAM_ID = new PublicKey(AmmIDL.metadata.address);

class CustomAmmService {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<Amm>;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
    // Use a dummy wallet for the provider since we are only building transactions
    const dummyWallet = new Wallet(Keypair.generate());
    this.provider = new AnchorProvider(this.connection, dummyWallet, { commitment: 'confirmed' });
    this.program = new Program<Amm>(AmmIDL, PROGRAM_ID, this.provider);
  }

  async createPoolAndAddLiquidity(params: CreatePoolWithSolParams) {
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

    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [poolKeypair.publicKey.toBuffer()],
      this.program.programId
    );

    const userTokenA = getAssociatedTokenAddressSync(baseMint, userPublicKey);
    const userLpToken = getAssociatedTokenAddressSync(lpMintKeypair.publicKey, userPublicKey);

    const instructions = [];

    // 1. Create temporary account for WSOL
    const rentForWrappedSol = await this.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: userPublicKey,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports: rentForWrappedSol,
        space: ACCOUNT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeAccountInstruction(wrappedSolAccount.publicKey, quoteMint, userPublicKey),
      SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: wrappedSolAccount.publicKey,
          lamports: Math.ceil(initialSolAmount * LAMPORTS_PER_SOL),
      }),
      createSyncNativeInstruction(wrappedSolAccount.publicKey)
    );

    // 2. Create user's ATA for the LP token if it doesn't exist
    const userLpTokenAccountInfo = await this.connection.getAccountInfo(userLpToken);
    if (userLpTokenAccountInfo === null) {
      instructions.push(
        createAssociatedTokenAccountInstruction(userPublicKey, userLpToken, userPublicKey, lpMintKeypair.publicKey)
      );
    }
    
    // 3. Instruction to initialize the pool (from our program Anchor)
    const initPoolIx = await this.program.methods
        .initializePool(100) // Taxa de 1% (100 basis points)
        .accounts({
          pool: poolKeypair.publicKey,
          poolAuthority,
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

    // 4. Instruction to add initial liquidity
    const addLiquidityIx = await this.program.methods
        .addLiquidity(new BN(initialBaseTokenAmount * Math.pow(10, baseTokenDecimals)), new BN(initialSolAmount * LAMPORTS_PER_SOL))
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

    // 5. Close the temporary WSOL account
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

    // Sign with the newly generated accounts
    transaction.sign([poolKeypair, vaultAKeypair, vaultBKeypair, lpMintKeypair, wrappedSolAccount]);

    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    return {
      transaction: serializedTransaction,
      ammId: poolKeypair.publicKey.toBase58(),
      lpTokenAddress: lpMintKeypair.publicKey.toBase58(),
    };
  }
}

export const customAmmService = new CustomAmmService();

