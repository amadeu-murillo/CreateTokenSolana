import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, mintTo, createAssociatedTokenAccount, getAssociatedTokenAddress } from "@solana/spl-token";

export async function POST(request: Request) {
  try {
    const { name, symbol, decimals, supply, imageUrl, wallet } = await request.json();

    if (!name || !symbol || !decimals || !supply || !wallet) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const payer = Keypair.generate(); // Em um app real, o usuário pagaria

    const airdropSignature = await connection.requestAirdrop(
      payer.publicKey,
      2 * 10 ** 9
    );
    await connection.confirmTransaction(airdropSignature);

    const mint = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const transaction = new (await import("@solana/web3.js")).Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        new PublicKey(wallet),
        new PublicKey(wallet),
        TOKEN_PROGRAM_ID
      )
    );
    
    // Simulação de criação de token
    console.log("Criando token com os seguintes dados:", { name, symbol, decimals, supply, imageUrl, wallet });
    const tokenAddress = new Keypair().publicKey.toBase58();
    
    // Em uma implementação real, você usaria a transaction acima para criar o token
    // const signature = await sendAndConfirmTransaction(connection, transaction, [payer, mint]);

    return NextResponse.json({ success: true, tokenAddress });
  } catch (error) {
    console.error("Erro ao criar token:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
