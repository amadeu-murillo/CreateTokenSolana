"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from './Documentation.module.css';

// Ícones SVG para clareza
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;


const documentationSections = [
    {
        icon: <IconPlusCircle />,
        title: "Como Criar um Token",
        id: "criar-token",
        steps: [
            "Conecte sua carteira Solana (Phantom, Solflare, etc.).",
            "Navegue até a página 'Criar'.",
            "Preencha os detalhes do seu token: Nome, Símbolo, Decimais e Fornecimento Total.",
            "Faça o upload de uma imagem para o seu token. Esta será a identidade visual dele.",
            "Revise as 'Configurações Avançadas' para decidir se deseja manter a autoridade para criar mais tokens ou congelá-los no futuro.",
            "Revise os custos de transação e a pré-visualização do seu token.",
            "Clique em 'Criar Token' e aprove a transação na sua carteira.",
            "Após a confirmação da rede, seu token será criado e enviado para sua carteira!"
        ]
    },
    {
        icon: <IconLayers />,
        title: "Como Adicionar Liquidez",
        id: "add-liquidez",
        steps: [
            "Após criar seu token, vá para a página 'Liquidez'.",
            "Selecione o token que você acabou de criar na lista de tokens da sua carteira.",
            "Insira a quantidade do seu token que você deseja adicionar ao pool de liquidez.",
            "Insira a quantidade de SOL que você deseja parear com seus tokens. A proporção entre os dois definirá o preço inicial.",
            "A plataforma criará automaticamente um 'Market ID' no OpenBook, que é um pré-requisito para a Raydium.",
            "Clique em 'Criar Pool e Adicionar Liquidez' e aprove a transação na sua carteira.",
            "Assim que a transação for confirmada, seu token estará disponível para negociação na Raydium!"
        ]
    },
    {
        icon: <IconFlame />,
        title: "Como Queimar Tokens (Burn)",
        id: "queimar-tokens",
        steps: [
            "Navegue para a página 'Queimar'.",
            "Selecione o token que você deseja queimar da sua carteira.",
            "Digite a quantidade de tokens a ser permanentemente removida de circulação.",
            "Você pode usar o botão 'MAX' para preencher com todo o saldo disponível.",
            "Clique em 'Queimar Tokens' e aprove a transação. Esta ação é irreversível."
        ]
    },
    {
        icon: <IconSend />,
        title: "Como Fazer um Airdrop",
        id: "airdrop",
        steps: [
            "Vá para a página 'Airdrop'.",
            "Insira o endereço (Mint) do token que você deseja distribuir.",
            "Na caixa de texto 'Lista de Destinatários', adicione os endereços das carteiras e as quantidades que cada uma deve receber.",
            "Formate cada linha como: `Endereço, Quantidade`. Você pode separar com vírgula, espaço ou ponto e vírgula.",
            "A plataforma se encarregará de criar as contas de token para os destinatários, se eles ainda não as tiverem.",
            "Clique em 'Fazer Airdrop' e aprove a transação para distribuir os tokens."
        ]
    },
    {
        icon: <IconSettings />,
        title: "Como Gerenciar Tokens",
        id: "gerenciar-tokens",
        steps: [
            "Acesse o 'Dashboard' para ver um histórico de todos os tokens que você criou com esta plataforma.",
            "Para cada token, você verá o endereço (Mint) e a data de criação.",
            "Você pode clicar para ver o token diretamente no explorador de blocos Solscan.",
            "Use os botões 'Remover Autoridade de Mint' ou 'Remover Autoridade de Freeze' para renunciar permanentemente a essas permissões, tornando o token totalmente descentralizado e seu fornecimento imutável."
        ]
    },
    {
        icon: <IconDollarSign />,
        title: "Programa de Afiliados",
        id: "afiliados",
        steps: [
            "Acesse a página 'Afiliados' no menu de navegação.",
            "Se sua carteira estiver conectada, seu link de referência exclusivo será exibido.",
            "Copie o link e compartilhe com sua comunidade, amigos ou seguidores.",
            "Para cada token que for criado por um usuário que acessou a plataforma através do seu link, você receberá uma comissão de 10% da nossa taxa de serviço.",
            "A comissão é paga em SOL e depositada diretamente na sua carteira na mesma transação da criação do token, de forma transparente e atômica."
        ]
    }
];

export default function DocumentationPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <IconBookOpen />
        <h1 className={styles.title}>Documentação da Plataforma</h1>
        <p className={styles.subtitle}>
          Um guia completo para utilizar todas as funcionalidades da CreateTokenSolana.
        </p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <nav className={styles.toc}>
            <h3 className={styles.tocTitle}>Navegação</h3>
            <ul>
              {documentationSections.map(section => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.icon}
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>
          {documentationSections.map(section => (
            <section key={section.id} id={section.id} className={styles.section}>
              <Card>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className={styles.stepsList}>
                    {section.steps.map((step, index) => (
                      <li key={index} className={styles.stepItem}>{step}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
