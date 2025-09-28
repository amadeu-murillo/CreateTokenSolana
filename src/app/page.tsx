"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Importando Card

// Ícones
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckSquare = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconGift = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;


export default function Home() {
  return (
    <>
      <div className="heroWrapper">
        <div className="container">
          <div className="content">
            <h1 className="title">Lance o seu Token na Solana em Minutos</h1>
            <p className="description">
              Crie o seu token SPL sem complicações. Conecte a sua carteira, defina os detalhes e faça o lançamento de forma segura e transparente. Ideal para comunidades, projetos e programadores.
            </p>
            <div className="buttonContainer">
                <Link href="/create">
                  <Button>
                    Criar o Meu Token Agora
                  </Button>
                </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="featuresSection">
        <h2>Funcionalidades Abrangentes</h2>
        <p className="featuresDescription">Tudo o que precisa para gerir o seu token SPL num só lugar.</p>
        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon"><IconPlusCircle /></div>
            <h3>Criação de Tokens</h3>
            <p>Lance o seu próprio token SPL na rede Solana com metadados completos, incluindo nome, símbolo e imagem.</p>
          </div>
           <div className="featureCard">
            <div className="featureIcon"><IconLayers /></div>
            <h3>Criação de Liquidez</h3>
            <p>Crie um pool de liquidez na Raydium. Permita que seu token seja negociado e estabeleça um preço de mercado inicial.</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon"><IconFlame /></div>
            <h3>Queima de Tokens (Burn)</h3>
            <p>Remova tokens de circulação de forma permanente para controlar a oferta e aumentar a escassez.</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon"><IconSend /></div>
            <h3>Distribuição (Airdrop)</h3>
            <p>Distribua os seus tokens para múltiplos endereços de uma só vez, ideal para campanhas de marketing e recompensas.</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon"><IconSettings /></div>
            <h3>Gestão de Autoridade</h3>
            <p>Tenha controlo total sobre o seu token, com a opção de renunciar às autoridades de "mint" e "freeze".</p>
          </div>
           {/* Passo 5: Adicionar Card de Afiliados */}
           <Link href="/afiliates" className="featureCard">
              <div className="featureIcon"><IconDollarSign /></div>
              <h3>Programa de Afiliados</h3>
              <p>Ganhe SOL indicando novos usuários. Gere seu link de afiliado e receba comissões por cada token criado.</p>
           </Link>
        </div>
      </section>

      <section className="howItWorksSection">
        <h2>Como Funciona</h2>
        <div className="stepsGrid">
          <div className="step">
            <div className="stepIcon"><IconWallet /></div>
            <h3>1. Conecte a Carteira</h3>
            <p>Conecte a sua carteira Solana de preferência (Phantom, Solflare, etc.).</p>
          </div>
          <div className="step">
            <div className="stepIcon"><IconFileText /></div>
            <h3>2. Preencha os Detalhes</h3>
            <p>Defina nome, símbolo, imagem e o fornecimento total do seu token.</p>
          </div>
          <div className="step">
            <div className="stepIcon"><IconCheckSquare /></div>
            <h3>3. Confirme a Transação</h3>
            <p>Aprove a transação na sua carteira para criar o token na blockchain.</p>
          </div>
          <div className="step">
            <div className="stepIcon"><IconGift /></div>
            <h3>4. Receba os seus Tokens</h3>
            <p>Os seus novos tokens são enviados instantaneamente para a sua carteira.</p>
          </div>
        </div>
      </section>

      <section className="faqSection" id="faq">
        <h2>Perguntas Frequentes</h2>
        <div className="faqGrid">
          <details className="faqItem">
            <summary><h3>Eu realmente sou o dono do token?</h3></summary>
            <p>Com certeza. A autoridade de "mint" (criar novos tokens) e "freeze" (congelar contas) é sua. Você tem controlo total sobre o token criado.</p>
          </details>
          <details className="faqItem">
            <summary><h3>A plataforma guarda alguma chave privada?</h3></summary>
            <p>Não. Jamais. Todas as transações são assinadas com segurança dentro da sua própria carteira. Nós nunca temos acesso às suas chaves ou aos seus fundos.</p>
          </details>
          <details className="faqItem">
            <summary><h3>O que compõe o custo total?</h3></summary>
            <p>O custo total é a soma da taxa de aluguel da rede Solana (para tornar a conta do token permanente), uma pequena taxa de transação e a nossa taxa de serviço. <Link href="/costs" className="faqLink">Veja os detalhes</Link>.</p>
          </details>
          <details className="faqItem">
            <summary><h3>Posso criar um token para a minha comunidade?</h3></summary>
            <p>Sim! Tokens SPL são perfeitos para comunidades, projetos de jogos, DAOs, programas de fidelidade e muito mais. Use a sua criatividade!</p>
          </details>
        </div>
      </section>
      <style jsx global>{`
        .heroWrapper {
          position: relative;
          overflow: hidden;
        }
        .heroWrapper::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, hsla(var(--primary), 0.1) 0%, transparent 70%);
          filter: blur(120px);
          z-index: -1;
          pointer-events: none;
        }
        .container {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          min-height: 70vh;
          padding: 2rem 1rem;
        }
        .content {
          max-width: 52rem;
        }
        .title {
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.05em;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1.5rem;
        }
        @media(min-width: 768px) {
          .title {
            font-size: 5rem;
          }
        }
        .description {
          font-size: 1.25rem;
          color: hsl(var(--muted-foreground));
          max-width: 42rem;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }
        .buttonContainer {
          max-width: 20rem;
          margin: 0 auto;
        }
        .featuresSection {
          width: 100%;
          max-width: 1100px;
          margin: 6rem auto;
          text-align: center;
          padding: 4rem 1.5rem;
          background-color: hsla(var(--card), 0.5);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          position: relative;
        }
        .featuresSection h2 {
          font-size: 2.25rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        .featuresDescription {
          font-size: 1.1rem;
          color: hsl(var(--muted-foreground));
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .featuresGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        .featureCard {
          text-align: left;
          padding: 2rem;
          background-color: hsl(var(--background));
          border-radius: var(--radius);
          border: 1px solid hsl(var(--border));
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .featureCard:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px hsla(var(--primary), 0.1);
          border-color: hsla(var(--primary), 0.5);
        }
        .featureIcon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background-image: var(--primary-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .featureCard h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .featureCard p {
          color: hsl(var(--muted-foreground));
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .howItWorksSection, .faqSection {
          width: 100%;
          max-width: 1100px;
          margin: 6rem auto;
          text-align: center;
          padding: 0 1.5rem;
        }
        .howItWorksSection h2, .faqSection h2 {
          font-size: 2.25rem;
          margin-bottom: 3rem;
          font-weight: 700;
        }
        .stepsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2rem;
          text-align: left;
        }
        .faqGrid {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 768px;
          margin: 0 auto;
          gap: 1rem;
          text-align: left;
        }
        .step {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 2rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .step:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .stepIcon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background-image: var(--primary-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .step h3 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .step p {
          color: hsl(var(--muted-foreground));
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .faqItem {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 0 1.5rem;
          transition: background-color 0.2s ease;
        }
        .faqItem[open] {
          background-color: hsla(var(--muted), 0.5);
        }
        .faqItem summary {
          cursor: pointer;
          outline: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .faqItem summary h3 {
          margin: 0;
          font-size: inherit;
          font-weight: inherit;
        }
        .faqItem summary::-webkit-details-marker {
          display: none;
        }
        .faqItem summary::after {
          content: '+';
          font-size: 1.75rem;
          font-weight: 300;
          color: hsl(var(--primary));
          transition: transform 0.2s ease;
        }
        .faqItem[open] summary::after {
          transform: rotate(45deg);
        }
        .faqItem p {
          color: hsl(var(--muted-foreground));
          font-size: 0.9rem;
          line-height: 1.6;
          padding-bottom: 1rem;
          margin-top: -0.5rem;
        }
        .faqLink {
          color: hsl(var(--primary));
          text-decoration: underline;
          font-weight: 500;
        }
      `}</style>
    </>
  );
}
