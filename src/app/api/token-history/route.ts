import { NextResponse } from 'next/server';
import { Connection, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface InitializeMintInfo {
  mint: string;
  decimals: number;
  mintAuthority: string;
  freezeAuthority?: string | null;
}

interface ParsedInitializeMintData {
  type: 'initializeMint';
  info: InitializeMintInfo;
}

type InitializeMintInstruction = ParsedInstruction & {
  parsed: ParsedInitializeMintData;
};

function isInitializeMintInstruction(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): instruction is InitializeMintInstruction {
  if (!('parsed' in instruction)) {
    return false;
  }
  const { parsed } = instruction;
  return (
    instruction.programId.equals(TOKEN_PROGRAM_ID) &&
    typeof parsed === 'object' &&
    parsed !== null &&
    'type' in parsed &&
    parsed.type === 'initializeMint' &&
    'info' in parsed &&
    typeof parsed.info === 'object' &&
    parsed.info !== null &&
    'mint' in parsed.info &&
    typeof parsed.info.mint === 'string'
  );
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10; // Itens por página

    if (!wallet) {
        return NextResponse.json({ error: 'Endereço da carteira é obrigatório.' }, { status: 400 });
    }

    try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const publicKey = new PublicKey(wallet);

        // A lógica de paginação no backend com getSignaturesForAddress é complexa.
        // A abordagem mais simples é carregar um número maior de assinaturas e paginar no frontend.
        // Se a performance se tornar um problema, seria necessário implementar uma lógica mais robusta com `before` e `until`.
        const allSignatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 });

        const tokenCreationTransactions = [];

        for (const sigInfo of allSignatures) {
            const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
            if (tx && tx.meta && tx.meta.err === null) {
                for (const instruction of tx.transaction.message.instructions) {
                    if (isInitializeMintInstruction(instruction)) {
                         tokenCreationTransactions.push({
                            signature: sigInfo.signature,
                            mint: instruction.parsed.info.mint,
                            blockTime: sigInfo.blockTime,
                        });
                    }
                }
            }
        }

        return NextResponse.json({ history: tokenCreationTransactions });

    } catch (error) {
        console.error('Erro ao buscar histórico de tokens:', error);
        let errorMessage = 'Erro interno do servidor ao buscar o histórico.';
        if (error instanceof Error) {
            if (error.message.includes('Failed to query long-term storage')) {
                errorMessage = 'Não foi possível carregar o histórico completo. O nó RPC da Solana está com dificuldades para aceder a dados antigos. Por favor, tente novamente mais tarde.';
                return NextResponse.json({ error: errorMessage }, { status: 503 });
            }
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}