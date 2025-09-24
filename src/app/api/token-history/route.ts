import { NextResponse } from 'next/server';
import { Connection, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { RPC_ENDPOINT } from '@/lib/constants';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Melhoria: Interfaces para tipagem estrita da instrução parseada
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

// Define o tipo exato da instrução que estamos procurando
type InitializeMintInstruction = ParsedInstruction & {
  parsed: ParsedInitializeMintData;
};

// Type guard para verificar se a instrução é do tipo 'initializeMint' de forma segura
function isInitializeMintInstruction(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): instruction is InitializeMintInstruction {
  // Primeiro, verifica se é uma ParsedInstruction verificando a existência da propriedade 'parsed'
  if (!('parsed' in instruction)) {
    return false;
  }
  // Agora que sabemos que é uma ParsedInstruction, podemos acessar 'parsed' com segurança
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

    if (!wallet) {
        return NextResponse.json({ error: 'Endereço da carteira é obrigatório.' }, { status: 400 });
    }

    try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const publicKey = new PublicKey(wallet);

        const allSignatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 });

        const tokenCreationTransactions = [];

        for (const sigInfo of allSignatures) {
            const tx = await connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 });
            if (tx && tx.meta && tx.meta.err === null) {
                for (const instruction of tx.transaction.message.instructions) {
                    // Usar o type guard aprimorado garante a tipagem correta
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
            errorMessage = error.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

