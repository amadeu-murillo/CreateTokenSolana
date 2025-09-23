import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export async function createToken(
  connection: Connection,
  payer: any,
  decimals: number,
  supply: number
) {
  // Cria conta de Mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    decimals
  );

  // Conta do usuário
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  // Mint inicial
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer.publicKey,
    supply * 10 ** decimals
  );

  return mint.toBase58();
}
