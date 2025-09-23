import TokenForm from "@/components/TokenForm";
import CostSummary from "@/components/CostSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import styles from './Create.module.css';

// SVG Icons as components
const TextCursorInput = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h1a3 3 0 0 1 3 3v13"/><path d="M11 4h1a3 3 0 0 1 3 3v13"/><path d="M17 4h1a3 3 0 0 1 3 3v13"/><path d="M12 20h10"/></svg>;
const CircleDot = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>;
const Coins = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88.71 4.12"/></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;

const tutorialSteps = [
    {
        icon: <TextCursorInput />,
        title: "Nome e Símbolo",
        description: "A identidade do seu token. O nome é como ele será conhecido (ex: MyToken), e o símbolo é a sua abreviação (ex: MYT)."
    },
    {
        icon: <CircleDot />,
        title: "Decimais",
        description: "Define a menor unidade fracionária do token. Para a maioria dos casos, 9 é o padrão recomendado pela Solana."
    },
    {
        icon: <Coins />,
        title: "Fornecimento Total",
        description: "A quantidade total de tokens que serão criados e colocados em circulação. Este número é fixo após a criação."
    },
    {
        icon: <ImageIcon />,
        title: "URL da Imagem",
        description: "O logotipo do seu token. Use um link direto (URL) para uma imagem (PNG, JPG) que será exibida em carteiras e exploradores."
    }
];

export default function CreatePage() {
  return (
    <div className={styles.grid}>
      <div className={styles.formContainer}>
        <Card>
          <CardHeader>
            <CardTitle>Crie seu Token SPL</CardTitle>
            <CardDescription>Preencha os detalhes abaixo para criar seu novo token na rede Solana.</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenForm />
          </CardContent>
        </Card>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.tutorialContainer}>
            <h3 className={styles.sidebarTitle}>Guia de Preenchimento</h3>
            <div className={styles.tutorialList}>
              {tutorialSteps.map((step, index) => (
                <div key={index} className={styles.tutorialItem}>
                    <div className={styles.tutorialIcon}>{step.icon}</div>
                    <div className={styles.tutorialText}>
                        <p className={styles.tutorialTitle}>{step.title}</p>
                        <p className={styles.tutorialDescription}>{step.description}</p>
                    </div>
                </div>
              ))}
            </div>
        </div>
        <div className={styles.costContainer}>
            <h3 className={styles.sidebarTitle}>Resumo de Custos</h3>
            <CostSummary />
        </div>
      </div>
    </div>
  );
}

