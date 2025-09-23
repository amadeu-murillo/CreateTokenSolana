import { Button } from "../components/ui/button";
import styles from './Home.module.css';
import Link from "next/link";

// Ícones para a seção "Como Funciona"
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckSquare = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconGift = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;


export default function Home() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* SUGESTÃO: Título mais persuasivo */}
          <h1 className={styles.title}>Lance seu Token na Solana em Minutos</h1>
          
          {/* SUGESTÃO: Descrição mais detalhada */}
          <p className={styles.description}>
            Crie seu token SPL sem complicações. Conecte sua carteira, defina os detalhes e faça o lançamento de forma segura e transparente. Ideal para comunidades, projetos e desenvolvedores.
          </p>
          
          {/* SUGESTÃO: Novo componente para destacar a taxa */}
          <div className={styles.feeHighlight}>
            <p>
              <span>Taxa de Criação</span>
              <strong>0.092 SOL</strong>
              <span>A mais baixa do mercado</span>
            </p>
          </div>

          <div className={styles.buttonContainer}>
            <Button asChild>
              {/* SUGESTÃO: Call to action mais forte */}
              <Link href="/create">Criar Meu Token Agora</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* SUGESTÃO: Nova seção "Como Funciona" */}
      <section className={styles.howItWorksSection}>
        <h2>Como Funciona</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepIcon}><IconWallet /></div>
            <h3>1. Conecte a Carteira</h3>
            <p>Conecte sua carteira Solana de preferência (Phantom, Solflare, etc.).</p>
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
            <h3>4. Receba seus Tokens</h3>
            <p>Seus novos tokens são enviados instantaneamente para sua carteira.</p>
          </div>
        </div>
      </section>

      {/* SUGESTÃO: Nova seção de FAQ para construir confiança */}
      <section className={styles.faqSection}>
        <h2>Perguntas Frequentes</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>Eu realmente sou o dono do token?</h3>
            <p>Com certeza. A autoridade de "mint" (criar novos tokens) e "freeze" (congelar contas) é sua. Você tem controle total sobre o token criado.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>A plataforma guarda alguma chave privada?</h3>
            <p>Não. Jamais. Todas as transações são assinadas com segurança dentro da sua própria carteira. Nós nunca temos acesso às suas chaves ou aos seus fundos.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>O que compõe o custo total?</h3>
            <p>O custo total é a soma da taxa de aluguel da rede Solana (para tornar a conta do token permanente), uma pequena taxa de transação e nossa taxa de serviço de 0.092 SOL.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Posso criar um token para minha comunidade?</h3>
            <p>Sim! Tokens SPL são perfeitos para comunidades, projetos de jogos, DAOs, programas de fidelidade e muito mais. Use sua criatividade!</p>
          </div>
        </div>
      </section>
    </>
  );
}
