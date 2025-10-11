import { NextResponse } from 'next/server';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  console.log("API /api/record-commission: Recebida uma requisição.");
  try {
    const body = await request.json();
    console.log("API /api/record-commission: Corpo da requisição:", body);
    
    const {
      affiliateWallet,
      commissionAmountSOL,
      transactionSignature,
      tokenCreatorWallet,
      mintAddress,
    } = body;

    if (!affiliateWallet || !commissionAmountSOL || !transactionSignature || !tokenCreatorWallet || !mintAddress) {
      console.error("API /api/record-commission: Faltando campos obrigatórios.", body);
      return NextResponse.json({ error: 'Faltando campos obrigatórios.' }, { status: 400 });
    }

    // Uma comissão só existe se houver uma carteira de afiliado.
    if (affiliateWallet) {
        const commissionRef = doc(collection(db, 'affiliate_commissions'));
        console.log(`API /api/record-commission: Preparando para gravar no Firestore com ID: ${commissionRef.id}`);
        await setDoc(commissionRef, {
            affiliateWallet,
            commissionAmountSOL: Number(commissionAmountSOL),
            transactionSignature,
            tokenCreatorWallet,
            mintAddress,
            createdAt: serverTimestamp(),
        });
        console.log("API /api/record-commission: Gravação no Firestore concluída.");
    } else {
        console.log("API /api/record-commission: Nenhuma carteira de afiliado fornecida, nenhuma comissão registrada.");
    }

    return NextResponse.json({ success: true, message: 'Comissão registrada (se aplicável).' });
  } catch (error) {
    console.error('Erro ao registrar comissão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao registrar a comissão.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

