import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import styles from '@/components/TokenPreview.module.css';

interface TokenPreviewProps {
    name: string;
    symbol: string;
    imageUrl: string;
    supply: string;
    tokenStandard: 'spl' | 'token-2022';
}

const TokenPreview = ({ name, symbol, imageUrl, supply, tokenStandard }: TokenPreviewProps) => {
    // Formata o supply com separadores de milhar
    const formattedSupply = new Intl.NumberFormat('pt-BR').format(Number(supply.replace(/\D/g, '')) || 0);

    return (
        <Card className={styles.previewCard}>
            <CardHeader>
                <CardTitle>Pré-visualização do Token</CardTitle>
                <CardDescription>É assim que seu token aparecerá.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className={styles.tokenDisplay}>
                    <img
                        src={imageUrl || 'https://placehold.co/80x80/24293E/FFFFFF?text=?'}
                        alt="Pré-visualização do token"
                        className={styles.tokenImage}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/24293E/FFFFFF?text=?'; }}
                    />
                    <div className={styles.tokenInfo}>
                        <div className={styles.nameAndBadge}>
                            <p className={styles.tokenName}>{name || 'Meu Token'}</p>
                            {tokenStandard === 'token-2022' && (
                                <span className={styles.tokenBadge}>Token-2022</span>
                            )}
                        </div>
                        <p className={styles.tokenSymbol}>{symbol || 'MEU'}</p>
                    </div>
                    <div className={styles.tokenSupply}>
                       <p className={styles.supplyValue}>{formattedSupply}</p>
                       <p className={styles.supplyLabel}>Fornecimento Total</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TokenPreview;
