import { Button } from "@/components/ui/button";
import styles from './Home.module.css';
import Link from "next/link";

// Ícones
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckSquare = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconGift = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;


export default function Home() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Lance o seu Token na Solana em Minutos</h1>
          <p className={styles.description}>
            Crie o seu token SPL sem complicações. Conecte a sua carteira, defina os detalhes e faça o lançamento de forma segura e transparente. Ideal para comunidades, projetos e programadores.
          </p>
          <div className={styles.feeHighlight}>
            <p>
              <span>Taxa de Criação</span>
              <strong>0.092 SOL</strong>
              <span>A mais baixa do mercado</span>
            </p>
          </div>
          <div className={styles.buttonContainer}>
              <Link href="/create">
                <Button asChild>
                  Criar o Meu Token Agora
                </Button>
              </Link>
          </div>
        </div>
      </div>

      <section className={styles.featuresSection}>
        <h2>Funcionalidades Abrangentes</h2>
        <p className={styles.featuresDescription}>Tudo o que precisa para gerir o seu token SPL num só lugar.</p>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconPlusCircle /></div>
            <h3>Criação de Tokens</h3>
            <p>Lance o seu próprio token SPL na rede Solana com metadados completos, incluindo nome, símbolo e imagem.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconFlame /></div>
            <h3>Queima de Tokens (Burn)</h3>
            <p>Remova tokens de circulação de forma permanente para controlar a oferta e aumentar a escassez.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconSend /></div>
            <h3>Distribuição (Airdrop)</h3>
            <p>Distribua os seus tokens para múltiplos endereços de uma só vez, ideal para campanhas de marketing e recompensas.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><IconSettings /></div>
            <h3>Gestão de Autoridade</h3>
            <p>Tenha controlo total sobre o seu token, com a opção de renunciar às autoridades de "mint" e "freeze".</p>
          </div>
        </div>
      </section>

      <section className={styles.howItWorksSection}>
        <h2>Como Funciona</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepIcon}><IconWallet /></div>
            <h3>1. Conecte a Carteira</h3>
            <p>Conecte a sua carteira Solana de preferência (Phantom, Solflare, etc.).</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}><IconFileText /></div>
            <h3>2. Preencha os Detalhes</h3>
            <p>Defina nome, símbolo, imagem e o fornecimento total do seu token.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}><IconCheckSquare /></div>
            <h3>3. Confirme a Transação</h3>
            <p>Aprove a transação na sua carteira para criar o token na blockchain.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}><IconGift /></div>
            <h3>4. Receba os seus Tokens</h3>
            <p>Os seus novos tokens são enviados instantaneamente para a sua carteira.</p>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <h2>Perguntas Frequentes</h2>
        <div className={styles.faqGrid}>
          <details className={styles.faqItem}>
            <summary><h3>Eu realmente sou o dono do token?</h3></summary>
            <p>Com certeza. A autoridade de "mint" (criar novos tokens) e "freeze" (congelar contas) é sua. Você tem controlo total sobre o token criado.</p>
          </details>
          <details className={styles.faqItem}>
            <summary><h3>A plataforma guarda alguma chave privada?</h3></summary>
            <p>Não. Jamais. Todas as transações são assinadas com segurança dentro da sua própria carteira. Nós nunca temos acesso às suas chaves ou aos seus fundos.</p>
          </details>
          <details className={styles.faqItem}>
            <summary><h3>O que compõe o custo total?</h3></summary>
            <p>O custo total é a soma da taxa de aluguel da rede Solana (para tornar a conta do token permanente), uma pequena taxa de transação e a nossa taxa de serviço de 0.092 SOL.</p>
          </details>
          <details className={styles.faqItem}>
            <summary><h3>Posso criar um token para a minha comunidade?</h3></summary>
            <p>Sim! Tokens SPL são perfeitos para comunidades, projetos de jogos, DAOs, programas de fidelidade e muito mais. Use a sua criatividade!</p>
          </details>
        </div>
      </section>
    </>
  );
}

