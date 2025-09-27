// src/app/create-liquidity-pool/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Este componente agora serve apenas para redirecionar para a nova página /add-liquidity
export default function CreateLiquidityPoolRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/add-liquidity');
    }, [router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <p>Redirecionando para a nova página de liquidez...</p>
        </div>
    );
}