import { Connection, Signer } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export async function createToken(
  connection: Connection,
  payer: Signer,
  decimals: number,
  supply: number
): Promise<string> {
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    decimals
  );

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

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
