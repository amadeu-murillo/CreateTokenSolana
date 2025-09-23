import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import styles from '@/components/TokenPreview.module.css';

interface TokenPreviewProps {
    name: string;
    symbol: string;
    imageUrl: string;
    supply: string;
}

const TokenPreview = ({ name, symbol, imageUrl, supply }: TokenPreviewProps) => {

    const formattedSupply = new Intl.NumberFormat('pt-BR').format(Number(supply) || 0);

    return (
        <Card className={styles.previewCard}>
            <CardHeader>
                <CardTitle>Pré-visualização do Token</CardTitle>
                <CardDescription>É assim que seu token aparecerá.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className={styles.tokenDisplay}>
                    <img 
                        src={imageUrl || 'https://via.placeholder.com/80'} 
                        alt="Pré-visualização do token" 
                        className={styles.tokenImage}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80'; }}
                    />
                    <div className={styles.tokenInfo}>
                        <p className={styles.tokenName}>{name || 'Meu Token'}</p>
                        <p className={styles.tokenSymbol}>{symbol || 'MEU'}</p>
                    </div>
                    <div className={styles.tokenSupply}>
                       <p className={styles.supplyValue}>{formattedSupply}</p>
                       <p className={styles.supplyLabel}>Fornecimento</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TokenPreview;

