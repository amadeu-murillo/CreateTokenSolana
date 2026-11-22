import type { Metadata } from "next";
import Link from "next/link";
import { OFFICIAL_LINKS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Responsible Use Policy",
  description: "Draft Responsible Use Policy for CreateTokenSolana.",
  robots: { index: true, follow: true },
};

export default function ResponsibleUsePage() {
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
        Política de Uso Responsável — CreateTokenSolana
      </h1>
      <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
        Última atualização: TODO: DATA · Canal de denúncia: {OFFICIAL_LINKS.supportEmail} (TODO:
        canal dedicado abuse@)
      </p>

      <ol style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingLeft: "1.25rem" }}>
        <li>
          <strong>Natureza da Ferramenta:</strong> O CreateTokenSolana é uma interface técnica
          não-custodial para construir transações destinadas a programas públicos da blockchain
          Solana. A plataforma não atua como corretora, custodiante, consultora financeira ou
          emissora de ativos.
        </li>
        <li>
          <strong>Ausência de Endosso:</strong> A criação de tokens, pools de liquidez, airdrops ou
          contratos de vesting por meio desta interface não constitui endosso, auditoria ou garantia
          de legitimidade de nenhum projeto. Cada criador responde integralmente por seus atos.
        </li>
        <li>
          <strong>Condutas Proibidas:</strong> É vedado utilizar a plataforma ou o programa de
          afiliados para fraudes, rug pulls, phishing, spam, violação de propriedade intelectual ou
          promoção enganosa de ativos digitais.
        </li>
        <li>
          <strong>Denúncia de Abuso:</strong> Para reportar uso abusivo da marca, links enganosos ou
          suspeita de golpe, envie a assinatura da transação, URL e evidências para{" "}
          <a href={`mailto:${OFFICIAL_LINKS.supportEmail}`} style={{ color: "#38bdf8" }}>
            {OFFICIAL_LINKS.supportEmail}
          </a>
          .
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
