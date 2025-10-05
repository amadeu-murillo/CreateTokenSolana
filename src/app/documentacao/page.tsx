"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from './Documentation.module.css';

// Ícones SVG para clareza
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;

const documentationSections = [
    {
        icon: <IconPlusCircle />,
        title: "Criação de Tokens (SPL e Token-2022)",
        id: "criar-token",
        summary: "Aprenda a criar seu próprio token fungível na Solana, definindo suas propriedades essenciais e metadados.",
        details: [
            "O processo de criação de token permite que você lance um ativo digital na blockchain da Solana. Nossa plataforma simplifica este processo em algumas etapas:",
            {
                type: 'list',
                items: [
                    "<strong>Detalhes do Token:</strong> Você define o <strong>Nome</strong> (ex: 'Moeda Lua'), <strong>Símbolo</strong> (ex: 'LUA'), <strong>Decimais</strong> (geralmente 9, para fracionamento), e o <strong>Fornecimento Total</strong> (a quantidade total de tokens que existirão).",
                    "<strong>Metadados (Imagem):</strong> A imagem do seu token é crucial para a identidade visual. Nós fazemos o upload para um serviço descentralizado e vinculamos ao seu token usando o padrão Metaplex, garantindo que ele apareça corretamente em carteiras e exploradores.",
                    "<strong>Padrão do Token:</strong> Você pode escolher entre o <strong>SPL Padrão</strong> (ideal para a maioria dos casos) e o <strong>Token-2022</strong>, que oferece funcionalidades avançadas como taxas de transferência (tax on transfer).",
                    "<strong>Autoridades:</strong> As 'Opções de Autoridade' são vitais para a confiança e descentralização. Ao desmarcar a 'Autoridade de Mint', você torna o fornecimento do seu token fixo e imutável. Desmarcar a 'Autoridade de Freeze' impede que qualquer pessoa congele tokens em carteiras, uma prática comum para projetos descentralizados.",
                    "<strong>Confirmação:</strong> Após preencher tudo, você aprova uma única transação na sua carteira. Nós cuidamos de toda a complexidade técnica na blockchain."
                ]
            }
        ]
    },
    {
        icon: <IconLayers />,
        title: "Criação de Pool de Liquidez",
        id: "criar-liquidez",
        summary: "Permita que seu token seja negociado publicamente criando um mercado em uma exchange descentralizada (DEX).",
        details: [
            "Um token sem liquidez não pode ser comprado ou vendido. Criar um pool de liquidez é o passo essencial para dar valor e utilidade ao seu ativo.",
            {
                type: 'list',
                items: [
                  "<strong>O que é um Pool?:</strong> É um par de dois ativos (no nosso caso, o seu token e SOL) trancados em um contrato inteligente em uma DEX como a Meteora. Isso cria um mercado onde as pessoas podem trocar um pelo outro.",
                  "<strong>Definindo o Preço Inicial:</strong> A proporção de tokens e SOL que você deposita inicialmente define o preço de lançamento. Por exemplo, se você depositar 1.000.000 do seu token e 10 SOL, o preço inicial de cada token será 0.00001 SOL.",
                  "<strong>Nossa Ferramenta:</strong> Na página 'Liquidez', você seleciona seu token, a quantidade que deseja depositar e a quantidade correspondente de SOL. Nós criamos e inicializamos o pool na Meteora para você de forma automatizada.",
                  "<strong>Taxas:</strong> Este processo envolve múltiplas transações na blockchain e, por isso, tem um custo de rede maior, além da nossa taxa de serviço."
                ]
            }
        ]
    },
    {
        icon: <IconFlame />,
        title: "Queima de Tokens (Burn)",
        id: "queimar-tokens",
        summary: "Reduza o fornecimento total do seu token, removendo-o permanentemente de circulação.",
        details: [
            "A queima de tokens é uma estratégia deflacionária. Ao diminuir a quantidade total de tokens existentes, você pode, teoricamente, aumentar a escassez e o valor dos tokens restantes.",
             {
                type: 'list',
                items: [
                    "<strong>Ação Irreversível:</strong> Uma vez que um token é queimado, ele é destruído para sempre e não pode ser recuperado.",
                    "<strong>Como Fazer:</strong> Na página 'Queimar', basta selecionar o token da sua carteira, inserir a quantidade a ser queimada e aprovar a transação. O fornecimento total refletido na blockchain será atualizado."
                ]
            }
        ]
    },
    {
        icon: <IconSend />,
        title: "Distribuição em Massa (Airdrop)",
        id: "airdrop",
        summary: "Envie seu token para centenas ou milhares de carteiras em uma única transação.",
        details: [
            "Airdrops são uma ferramenta poderosa para marketing, engajamento de comunidade e distribuição inicial do seu token.",
            {
                type: 'list',
                items: [
                    "<strong>Formato da Lista:</strong> Prepare uma lista simples de texto onde cada linha contém o endereço da carteira do destinatário e a quantidade, separados por vírgula, espaço ou ponto e vírgula.",
                    "<strong>Validação Inteligente:</strong> Nossa ferramenta valida sua lista para garantir que os endereços são válidos e as quantidades são números corretos, evitando erros e perda de fundos.",
                    "<strong>Criação de Contas (ATA):</strong> Uma grande vantagem da nossa plataforma é que, se um destinatário ainda não tiver uma conta para o seu token, nós a criamos automaticamente para ele dentro da mesma transação, garantindo que o airdrop seja bem-sucedido.",
                    "<strong>Eficiência:</strong> Todas as transferências são agrupadas em uma única transação, economizando tempo e taxas de rede."
                ]
            }
        ]
    },
    {
        icon: <IconSettings />,
        title: "Gerenciamento de Autoridades",
        id: "gerenciar-tokens",
        summary: "Visualize os tokens que você criou e renuncie às autoridades de Mint e Freeze para aumentar a descentralização.",
        details: [
            "O Dashboard de Gerenciamento é o seu centro de controle para os tokens criados através da nossa plataforma.",
            {
                type: 'list',
                items: [
                    "<strong>Visualização:</strong> A página lista todos os tokens onde sua carteira conectada ainda possui autoridade de Mint ou Freeze.",
                    "<strong>Renunciar Autoridade:</strong> Renunciar a essas autoridades é uma ação permanente e um sinal forte de confiança para a sua comunidade. Significa que você não pode mais criar novos tokens (se renunciar ao Mint) ou congelar fundos (se renunciar ao Freeze).",
                    "<strong>Como Fazer:</strong> Basta selecionar o token e clicar no botão correspondente para remover a autoridade. Você precisará aprovar uma transação na sua carteira para confirmar a ação."
                ]
            }
        ]
    },
    {
        icon: <IconDollarSign />,
        title: "Programa de Afiliados",
        id: "afiliados",
        summary: "Ganhe comissões em SOL ao indicar novos usuários para a nossa plataforma.",
        details: [
            "Nosso programa de afiliados foi projetado para ser simples, transparente e lucrativo.",
            {
                type: 'list',
                items: [
                    "<strong>Link Exclusivo:</strong> Ao conectar sua carteira na página 'Afiliados', um link de referência é gerado usando sua chave pública como identificador (`?ref=SUA_CARTEIRA`).",
                    "<strong>Comissão de 10%:</strong> Você recebe 10% da nossa taxa de serviço (0.01 SOL) por cada token criado por um usuário que veio do seu link.",
                    "<strong>Pagamento Atômico:</strong> A comissão é transferida para sua carteira na mesma transação em que o token do seu indicado é criado. Isso é feito de forma segura e automática na blockchain, garantindo que você receba seus ganhos instantaneamente.",
                    "<strong>Painel de Ganhos:</strong> Você pode acompanhar seu total de ganhos, o número de indicações e ver o histórico das suas últimas comissões, com links diretos para as transações no Solscan."
                ]
            }
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
                  <CardDescription className={styles.sectionSummary}>{section.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.detailsContainer}>
                    {section.details.map((detail, index) => {
                      if (typeof detail === 'string') {
                        return <p key={index}>{detail}</p>;
                      }
                      if (detail.type === 'list') {
                        return (
                          <ul key={index} className={styles.detailsList}>
                            {detail.items.map((item, itemIndex) => (
                              <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
                            ))}
                          </ul>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
