"use client";

import { useState, useMemo, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./AddLiquidity.module.css";
import Notification from '@/components/ui/Notification';
import { TokenSelector } from '@/components/TokenSelector';
import { useUserTokens } from '@/hooks/useUserTokens';
import { SERVICE_FEE_CREATE_LP_SOL } from '@/lib/constants';
import { PriceMath, WhirlpoolData } from '@orca-so/whirlpools-sdk';
import { orcaWhirlpoolService } from '@/lib/services/orcaWhirlpoolService';
import { NATIVE_MINT } from '@solana/spl-token';

const IconInfo = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

interface OrcaPool {
    address: string;
    tokenMintA: string;
    tokenMintB: string;
    tickSpacing: number;
    name: string;
}

export default function AddLiquidityPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();

    const [selectedTokenMint, setSelectedTokenMint] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');

    const [allOrcaPools, setAllOrcaPools] = useState<OrcaPool[]>([]);
    const [filteredPools, setFilteredPools] = useState<OrcaPool[]>([]);
    const [selectedPoolAddress, setSelectedPoolAddress] = useState<string>('');
    const [poolData, setPoolData] = useState<WhirlpoolData | null>(null);
    
    const [lowerPrice, setLowerPrice] = useState('');
    const [upperPrice, setUpperPrice] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string; txId?: string } | null>(null);

    const selectedToken = useMemo(() => userTokens.find(t => t.mint === selectedTokenMint) || null, [userTokens, selectedTokenMint]);
    const solToken = useMemo(() => ({
        mint: NATIVE_MINT.toBase58(),
        decimals: 9,
        symbol: "SOL",
        name: "Solana"
    }), []);
    
    useEffect(() => {
        const fetchAllPools = async () => {
            try {
                const response = await fetch('/api/pools');
                if (response.ok) {
                    const pools = await response.json();
                    setAllOrcaPools(pools);
                } else {
                    console.error("Falha ao buscar pools");
                }
            } catch (error) {
                console.error("Erro ao buscar pools:", error);
            }
        };
        fetchAllPools();
    }, []);

    useEffect(() => {
        if (selectedTokenMint && allOrcaPools.length > 0) {
            const pools = allOrcaPools.filter(p => p.tokenMintA === selectedTokenMint || p.tokenMintB === selectedTokenMint);
            setFilteredPools(pools);
            setSelectedPoolAddress(pools.length > 0 ? pools[0].address : '');
        } else {
            setFilteredPools([]);
            setSelectedPoolAddress('');
        }
    }, [selectedTokenMint, allOrcaPools]);

    useEffect(() => {
        const getPoolData = async () => {
            if (selectedPoolAddress && selectedToken) {
                setIsLoading(true);
                try {
                    const data = await orcaWhirlpoolService.fetchPoolData(connection, new PublicKey(selectedPoolAddress));
                    setPoolData(data);
                    if(data) {
                        const tokenA = data.tokenMintA.toBase58() === selectedToken.mint ? selectedToken : solToken;
                        const tokenB = data.tokenMintB.toBase58() === NATIVE_MINT.toBase58() ? solToken : selectedToken;
                        
                        const currentPrice = PriceMath.sqrtPriceX64ToPrice(
                            data.sqrtPrice,
                            tokenA.decimals,
                            tokenB.decimals
                        );
                        
                        setLowerPrice((currentPrice.mul(0.9)).toFixed(tokenB.decimals));
                        setUpperPrice((currentPrice.mul(1.1)).toFixed(tokenB.decimals));
                    }
                } catch (e) {
                    console.error("Falha ao buscar dados do pool", e);
                    setPoolData(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setPoolData(null);
            }
        };
        getPoolData();
    }, [selectedPoolAddress, connection, selectedToken, solToken]);


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!publicKey || !sendTransaction || !selectedToken || !selectedPoolAddress || !poolData || !wallet) {
            setFeedback({ type: 'error', message: 'Por favor, conecte a carteira e preencha todos os campos.' });
            return;
        }
        
        setIsLoading(true);
        setFeedback(null);

        try {
            const payload = {
                userWalletAddress: publicKey.toBase58(),
                tokenMint: selectedToken.mint,
                tokenAmount: tokenAmount,
                poolAddress: selectedPoolAddress,
                lowerPrice: lowerPrice,
                upperPrice: upperPrice,
            };

            const response = await fetch('/api/add-liquidity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao construir a transação no backend.');
            }
            
            const transactionBuffer = Buffer.from(data.transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(transactionBuffer);
            
            const txSignature = await sendTransaction(transaction, connection);
            
            await connection.confirmTransaction(txSignature, 'confirmed');
            
            setFeedback({
                type: 'success',
                message: `Liquidez adicionada com sucesso! Posição: ${data.positionMint}`,
                txId: txSignature
            });

        } catch (error: any) {
            const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
            setFeedback({ type: 'error', message: `Erro: ${errorMessage}` });
        } finally {
            setIsLoading(false);
        }
    };
    
    const currentPrice = poolData && selectedToken ? PriceMath.sqrtPriceX64ToPrice(poolData.sqrtPrice, selectedToken.decimals, 9).toFixed(selectedToken.decimals) : '0';

    const isButtonDisabled = !publicKey || isLoading || !selectedToken || !tokenAmount || !lowerPrice || !upperPrice;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Adicionar Liquidez</h1>
                <p className={styles.pageDescription}>
                    Crie uma nova posição de liquidez (Token/SOL) num Orca Whirlpool para permitir negociações.
                </p>
            </header>

            <div className={styles.container}>
                <Card className={styles.actionCard}>
                    <form onSubmit={handleSubmit}>
                        <CardContent className={styles.cardContent}>
                             {feedback && (
                                <Notification
                                    message={feedback.message}
                                    type={feedback.type}
                                    onClose={() => setFeedback(null)}
                                    txId={feedback.txId}
                                />
                            )}
                            <div className={styles.inputGroup}>
                                <Label htmlFor="token-select">Seu Token</Label>
                                <TokenSelector
                                    tokens={userTokens}
                                    selectedTokenMint={selectedTokenMint}
                                    onSelectToken={setSelectedTokenMint}
                                    isLoading={isLoadingUserTokens}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            {filteredPools.length > 0 && (
                                <div className={styles.inputGroup}>
                                    <Label htmlFor="pool-select">Pool de Liquidez (vs SOL)</Label>
                                    <select id="pool-select" value={selectedPoolAddress} onChange={e => setSelectedPoolAddress(e.target.value)} className={styles.select}>
                                        {filteredPools.map(pool => (
                                            <option key={pool.address} value={pool.address}>
                                                {pool.name} (Tick: {pool.tickSpacing})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                             {poolData && selectedToken && (
                                <>
                                    <div className={styles.currentPrice}>Preço Atual: <strong>{currentPrice}</strong> SOL por {selectedToken.symbol}</div>
                                    <div className={styles.priceRange}>
                                        <div className={styles.inputGroup}>
                                            <Label htmlFor="lowerPrice">Preço Mínimo (em SOL)</Label>
                                            <Input id="lowerPrice" type="number" value={lowerPrice} onChange={e => setLowerPrice(e.target.value)} placeholder="0.001" required />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <Label htmlFor="upperPrice">Preço Máximo (em SOL)</Label>
                                            <Input id="upperPrice" type="number" value={upperPrice} onChange={e => setUpperPrice(e.target.value)} placeholder="0.002" required />
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className={styles.inputGroup}>
                                <div className={styles.labelContainer}>
                                    <Label htmlFor="tokenAmount">Quantidade de {selectedToken?.symbol || 'Tokens'} a depositar</Label>
                                    {selectedToken && <span className={styles.balance}>Saldo: {parseFloat(selectedToken.amount).toLocaleString()}</span>}
                                </div>
                                <Input id="tokenAmount" type="number" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder="Ex: 1000000" required disabled={!selectedToken || isLoading} />
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isButtonDisabled} className="w-full">
                                {isLoading ? 'A adicionar liquidez...' : `Adicionar Liquidez (Taxa: ${SERVICE_FEE_CREATE_LP_SOL} SOL)`}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <aside className={styles.infoCard}>
                     <Card>
                         <CardHeader>
                            <CardTitle className={styles.sidebarTitle}>Liquidez Concentrada</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <div className={styles.infoBox}>
                                <IconInfo />
                                <span>
                                    Ao definir uma faixa de preço (mínimo e máximo), sua liquidez é "concentrada", gerando mais taxas quando o preço do token estiver dentro dessa faixa. Fora da faixa, sua posição se tornará inativa (composta por apenas um dos dois tokens) até que o preço retorne.
                                </span>
                             </div>
                         </CardContent>
                     </Card>
                </aside>
            </div>
        </div>
    );
}

