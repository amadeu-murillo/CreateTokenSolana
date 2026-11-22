import type { Metadata } from "next";
import Link from "next/link";
import { OFFICIAL_LINKS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Affiliate Program Terms",
  description: "Draft Affiliate Program Terms for CreateTokenSolana.",
  robots: { index: true, follow: true },
};

export default function AffiliateTermsPage() {
  return (
    <article style={{ maxWidth: 820, margin: "0 auto", padding: "1.5rem 0 3rem", lineHeight: 1.65 }}>
      <p
        role="note"
        style={{
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: "rgba(255, 184, 0, 0.12)",
          border: "1px solid rgba(255, 184, 0, 0.35)",
          color: "#fbbf24",
          fontWeight: 600,
          marginBottom: "1.25rem",
        }}
      >
        Rascunho — revisar com assessoria jurídica antes de publicar. / Draft — review with legal
        counsel before publishing.
      </p>

      <h1 style={{ fontSize: "1.9rem", fontWeight: 800, marginBottom: "0.5rem" }}>
        Termos do Programa de Afiliados — CreateTokenSolana
      </h1>
      <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
        Última atualização: TODO: DATA · Operador: TODO: RAZÃO SOCIAL / OPERADOR · Contato:{" "}
        {OFFICIAL_LINKS.supportEmail}
      </p>

      <ol style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingLeft: "1.25rem" }}>
        <li>
          <strong>Elegibilidade e Adesão:</strong> A participação é aberta a qualquer pessoa física
          ou jurídica legalmente capaz que possua uma carteira Solana pública válida (chave ed25519
          compatível com o System Program). Ao gerar ou divulgar um link <code>?ref=</code>, o
          participante concorda integralmente com estes Termos.
        </li>
        <li>
          <strong>Comissão e Pagamento:</strong> O afiliado recebe 30% da taxa de serviço da
          plataforma nas operações elegíveis (conforme tabela vigente em{" "}
          <Link href="/costs">/costs</Link>), e 70% são destinados à carteira do desenvolvedor. O
          pagamento ocorre atomicamente na mesma transação on-chain via{" "}
          <code>SystemProgram.transfer</code>, sem custódia intermediária.
        </li>
        <li>
          <strong>Atribuição, Autoindicação e Fallback:</strong> A atribuição segue o modelo de
          último clique com janela de 30 dias (armazenada em <code>localStorage</code> e cookie
          próprio). Autoindicação (<code>?ref=</code> igual à carteira conectada) é proibida e
          ignorada automaticamente. Se o endereço for inválido, não pertencer ao System Program ou
          uma conta zerada receber fração inferior ao mínimo rent-exempt (~0,00089088 SOL), 100% da
          taxa será roteada silenciosamente à carteira do desenvolvedor para evitar falha da
          transação.
        </li>
        <li>
          <strong>Práticas Proibidas:</strong> É proibido praticar spam, prometer lucro garantido ou
          renda fácil, fazer alegações falsas sobre auditorias ou segurança, promover rug pulls ou
          golpes e usar a marca CreateTokenSolana de forma enganosa.
        </li>
        <li>
          <strong>Revogação e Alterações:</strong> O operador pode atualizar percentuais, serviços
          elegíveis ou estes Termos mediante publicação no site e bloquear endereços que violem
          estas regras para futuras indexações ou atribuições.
        </li>
        <li>
          <strong>Limitação de Responsabilidade:</strong> A interface é fornecida no estado em que
          se encontra, sem garantia de ganhos, volume de tráfego ou disponibilidade contínua da rede
          Solana.
        </li>
        <li>
          <strong>Impostos:</strong> O afiliado é o único responsável por declarar e recolher
          quaisquer tributos incidentes sobre comissões recebidas em SOL em sua jurisdição (TODO:
          definir foro e lei aplicável).
        </li>
      </ol>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/affiliates" style={{ color: "#38bdf8", fontWeight: 600 }}>
          ← Voltar para /affiliates
        </Link>
      </p>
    </article>
  );
}
