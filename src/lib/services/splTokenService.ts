// src/lib/services/splTokenService.ts

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  MINT_SIZE,
} from '@solana/spl-token';
import { DEV_WALLET_ADDRESS, RPC_ENDPOINT, SERVICE_FEE_CREATE_TOKEN_LAMPORTS } from '@/lib/constants';
import { Umi } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { createNoopSigner, signerIdentity, percentAmount } from '@metaplex-foundation/umi';

interface CreateSplTokenParams {
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
    supply: number;
    wallet: string;
    mintAuthority: boolean;
    freezeAuthority: boolean;
    isMetadataMutable: boolean;
    affiliate: string | null;
}

async function getAffiliateInstructions(userPublicKey: PublicKey, affiliate: string | null): Promise<TransactionInstruction[]> {
    const instructions: TransactionInstruction[] = [];
    let affiliatePublicKey: PublicKey | null = null;
    
    try {
        if (affiliate && affiliate !== userPublicKey.toBase58()) {
            affiliatePublicKey = new PublicKey(affiliate);
        }
    } catch (error) {
        console.warn('Endereço de afiliado inválido recebido:', affiliate);
        affiliatePublicKey = null;
    }

    if (affiliatePublicKey) {
        const affiliateCommission = Math.round(SERVICE_FEE_CREATE_TOKEN_LAMPORTS * 0.10);
        const developerCut = SERVICE_FEE_CREATE_TOKEN_LAMPORTS - affiliateCommission;
        instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: affiliatePublicKey, lamports: affiliateCommission }));
        instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: DEV_WALLET_ADDRESS, lamports: developerCut }));
    } else {
        instructions.push(SystemProgram.transfer({ fromPubkey: userPublicKey, toPubkey: DEV_WALLET_ADDRESS, lamports: SERVICE_FEE_CREATE_TOKEN_LAMPORTS }));
    }
    
    return instructions;
}

function getUmi(userPublicKey: PublicKey): Umi {
    const umi = createUmi(RPC_ENDPOINT);
    const userUmiSigner = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));
    umi.use(signerIdentity(userUmiSigner));
    return umi;
}

export async function createSplTokenTransaction(params: CreateSplTokenParams) {
    const {
        name,
        symbol,
        imageUrl,
        decimals,
        supply,
        wallet,
        mintAuthority,
        freezeAuthority,
        isMetadataMutable,
        affiliate
    } = params;

    const userPublicKey = new PublicKey(wallet);
    const mintKeypair = Keypair.generate();
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    const umi = getUmi(userPublicKey);
    
    const rentLamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    
    const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userPublicKey,
        false,
        TOKEN_PROGRAM_ID
    );
    
    const instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000 }),
        ...(await getAffiliateInstructions(userPublicKey, affiliate)),
        SystemProgram.createAccount({
            fromPubkey: userPublicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: rentLamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            decimals,
            userPublicKey,
            freezeAuthority ? userPublicKey : null,
            TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
            userPublicKey,
            associatedTokenAccount,
            userPublicKey,
            mintKeypair.publicKey,
            TOKEN_PROGRAM_ID
        ),
        createMintToInstruction(
            mintKeypair.publicKey,
            associatedTokenAccount,
            userPublicKey,
            BigInt(supply * Math.pow(10, decimals)),
            [],
            TOKEN_PROGRAM_ID
        )
    ];

    const userUmiSigner = umi.identity;
    const createMetadataIx = createV1(umi, {
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        authority: userUmiSigner,
        name: name,
        symbol: symbol,
        uri: imageUrl,
        sellerFeeBasisPoints: percentAmount(0, 2),
        tokenStandard: TokenStandard.Fungible,
        isMutable: isMetadataMutable,
        payer: userUmiSigner,
        updateAuthority: userUmiSigner,
    }).getInstructions();

    const web3Instructions = createMetadataIx.map(ix => ({
        keys: ix.keys.map(key => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        programId: new PublicKey(ix.programId),
        data: Buffer.from(ix.data),
    }));
      
    instructions.push(...web3Instructions);

    if (!mintAuthority) {
        instructions.push(
            createSetAuthorityInstruction(
                mintKeypair.publicKey,
                userPublicKey,
                AuthorityType.MintTokens,
                null,
                [],
                TOKEN_PROGRAM_ID
            )
        );
    }
      
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([mintKeypair]);

    const serializedTransaction = transaction.serialize();
    const base64Transaction = Buffer.from(serializedTransaction).toString('base64');
    
    return {
        transaction: base64Transaction,
        mintAddress: mintKeypair.publicKey.toBase58(),
    };
}


