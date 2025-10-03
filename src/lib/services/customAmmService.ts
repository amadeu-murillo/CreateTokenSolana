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
  ComputeBudgetProgram,
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
} from '@solana/spl-token';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { IDL, type Amm } from '@/lib/idl/amm';
import { CreatePoolWithSolParams } from '@/types/api';
import { RPC_ENDPOINT, DEV_WALLET_ADDRESS, SERVICE_FEE_CREATE_LP_LAMPORTS } from '@/lib/constants';

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
        
        // NOVO: Adiciona uma verificação para a conta de token base do usuário
        console.log(`LOG: Verificando a conta de token base do usuário (${userTokenA.toBase58()})...`);
        try {
            const userTokenAAccountInfo = await this.connection.getAccountInfo(userTokenA);
            if (!userTokenAAccountInfo) {
                throw new Error(`A conta de token para o mint ${baseMint.toBase58()} não foi encontrada na sua carteira.`);
            }
            const tokenBalance = await this.connection.getTokenAccountBalance(userTokenA);
            console.log(`LOG: Saldo encontrado na conta do token base: ${tokenBalance.value.uiAmount}`);
            if (tokenBalance.value.uiAmount === null || tokenBalance.value.uiAmount < initialBaseTokenAmount) {
                throw new Error(`Saldo insuficiente na conta do token base. Necessário: ${initialBaseTokenAmount}, Disponível: ${tokenBalance.value.uiAmount ?? 0}.`);
            }
        } catch (e: any) {
            // Re-lança erros específicos ou um genérico se não for nosso erro personalizado
            if (e.message.startsWith("A conta de token") || e.message.startsWith("Saldo insuficiente")) {
                console.error("LOG: Erro na verificação da conta de token do usuário:", e.message);
                throw e;
            }
            console.error("LOG: Erro ao buscar informações da conta de token do usuário:", e);
            throw new Error(`Não foi possível verificar a sua conta de token para o mint ${baseMint.toBase58()}. Verifique se a conta existe.`);
        }
        console.log("LOG: Verificação da conta de token base do usuário bem-sucedida.");

        const userLpToken = getAssociatedTokenAddressSync(lpMintKeypair.publicKey, userPublicKey);

        const instructions = [];

        // Adiciona instruções para aumentar o limite de computação e definir uma taxa de prioridade
        instructions.push(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 })
        );

        // Adiciona a instrução para transferir a taxa de serviço para a carteira do desenvolvedor
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
        
        // CORREÇÃO: Usar Math.ceil para garantir que o valor de lamports seja um inteiro.
        const solLamports = Math.ceil(initialSolAmount * LAMPORTS_PER_SOL);

        instructions.push(
            SystemProgram.createAccount({
                fromPubkey: userPublicKey,
                newAccountPubkey: wrappedSolAccount.publicKey,
                lamports: rentForWrappedSol, // Apenas o valor do aluguel na criação
                space: ACCOUNT_SIZE,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeAccountInstruction(wrappedSolAccount.publicKey, quoteMint, userPublicKey),
            // Transferir os SOLs para a nova conta
            SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: wrappedSolAccount.publicKey,
                lamports: solLamports,
            }),
            createSyncNativeInstruction(wrappedSolAccount.publicKey)
        );
        console.log("Instruções WSOL adicionadas.");

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
            .initializePool(100) // Taxa de 1% (100 basis points) - CORREÇÃO: Passar como número
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
            // CORREÇÃO: Removido o .signers() daqui. A assinatura será feita na transação final.
            .instruction();
        
        instructions.push(initPoolIx);
        console.log("Instrução initializePool construída com sucesso.");

        // 4. Instruction to add initial liquidity
        console.log("A construir a instrução addLiquidity...");
        
        // GARANTIA DE INTEIRO: Garante que os valores de amount sejam inteiros antes de criar BN.
        const baseTokenAmountLamports = new BN(Math.trunc(initialBaseTokenAmount * Math.pow(10, baseTokenDecimals)));
        const solAmountLamports = new BN(solLamports);

        const addLiquidityIx = await this.program.methods
            .addLiquidity(baseTokenAmountLamports, solAmountLamports)
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

        // NOVO LOG: Detalha todas as instruções antes de criar a transação
        console.log("LOG: Compilando mensagem com as seguintes instruções:", JSON.stringify(instructions.map((ix, i) => ({
            [`instrucao_${i}`]: {
                programId: ix.programId.toBase58(),
                keys: ix.keys.map(k => ({ pubkey: k.pubkey.toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
                data: `(Buffer com tamanho: ${ix.data.length})`
            }
        })), null, 2));

        const messageV0 = new TransactionMessage({
            payerKey: userPublicKey,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(messageV0);
        console.log("LOG: Transação (VersionedTransaction) criada:", transaction);

        // Sign with the newly generated accounts
        const signers = [poolKeypair, vaultAKeypair, vaultBKeypair, lpMintKeypair, wrappedSolAccount];
        console.log("LOG: A assinar a transação com as seguintes contas geradas:", signers.map(s => s.publicKey.toBase58()));
        
        transaction.sign(signers);

        console.log("LOG: Assinaturas presentes após assinar com as contas geradas:", transaction.signatures);

        const serializedTransaction = Buffer.from(transaction.serialize());
        const base64Transaction = serializedTransaction.toString('base64');
        console.log("LOG: Transação serializada com sucesso. Tamanho do buffer:", serializedTransaction.length);

        return {
            transaction: base64Transaction,
            ammId: poolKeypair.publicKey.toBase58(),
            lpTokenAddress: lpMintKeypair.publicKey.toBase58(),
        };
    } catch (error) {
        console.error("--- ERRO DETALHADO em createPoolAndAddLiquidity (SERVICE) ---");
        if (error instanceof Error) {
            console.error("Nome do Erro:", error.name);
            console.error("Mensagem do Erro:", error.message);
            console.error("Stack do Erro:", error.stack);
        } else {
            console.error("Objeto completo do erro:", error);
        }
        console.error("--- FIM DO ERRO DETALHADO ---");
        // Lança o erro para que a rota da API possa capturá-lo e retornar uma resposta 500
        throw error;
    }
  }
}

export const customAmmService = new CustomAmmService();


