import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AffiliateTransaction {
    signature: string;
    blockTime: number; // Usaremos o createdAt do Firebase
    amount: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Endereço da carteira é obrigatório.' }, { status: 400 });
  }

  try {
    const commissionsCol = collection(db, 'affiliate_commissions');
    // REMOVIDO: orderBy('createdAt', 'desc') para evitar a necessidade de um índice composto.
    const q = query(
        commissionsCol, 
        where('affiliateWallet', '==', wallet),
        limit(100) // Limita às últimas 100 comissões por performance
    );

    const querySnapshot = await getDocs(q);

    let totalEarnings = 0;
    const transactions: AffiliateTransaction[] = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        totalEarnings += data.commissionAmountSOL || 0;
        
        // O blockTime não está diretamente disponível, então usamos o timestamp do servidor do Firestore
        const createdAtTimestamp = data.createdAt?.toDate();

        transactions.push({
            signature: data.transactionSignature,
            blockTime: createdAtTimestamp ? Math.floor(createdAtTimestamp.getTime() / 1000) : 0,
            amount: data.commissionAmountSOL,
        });
    });

    // ADICIONADO: Ordenação dos resultados no código após a busca.
    transactions.sort((a, b) => b.blockTime - a.blockTime);

    const referralCount = querySnapshot.size;

    return NextResponse.json({
      totalEarningsSol: totalEarnings,
      referralCount,
      transactions: transactions.slice(0, 10), // Retorna apenas as últimas 10 para a UI
    });

  } catch (error) {
    console.error('Erro ao buscar ganhos de afiliado do Firebase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

