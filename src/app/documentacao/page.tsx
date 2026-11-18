"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { PRICING_SCHEDULE_TABLE, formatSolAmount } from "@/config/pricing";
import styles from "./Documentation.module.css";

const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "criar-token": <IconPlusCircle />,
  "criar-liquidez": <IconLayers />,
  "queimar-tokens": <IconFlame />,
  airdrop: <IconSend />,
  "gerenciar-tokens": <IconSettings />,
  afiliados: <IconDollarSign />,
};

export default function DocumentationPage() {
  const { t, locale } = useLanguage();
  const isPt = locale === "pt" || locale === "pt-BR";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <IconBookOpen />
        <h1 className={styles.title}>{t.docsPage.pageTitle}</h1>
        <p className={styles.subtitle}>{t.docsPage.pageSubtitle}</p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <nav className={styles.toc}>
            <h3 className={styles.tocTitle}>{t.docsPage.tocTitle}</h3>
            <ul>
              {t.docsPage.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {SECTION_ICONS[section.id] || <IconBookOpen />}
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#pricing-schedule" className={styles.tocLink}>
                  <IconDollarSign />
                  <span>{isPt ? "Tabela Oficial de Preços" : "Official Pricing Schedule"}</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>
          {t.docsPage.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <Card>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>{section.title}</CardTitle>
                  <CardDescription className={styles.sectionSummary}>
                    {section.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.detailsContainer}>
                    <p>{section.intro}</p>
                    <ul className={styles.detailsList}>
                      {section.bullets.map((bullet, idx) => (
                        <li key={idx}>
                          <strong>{bullet.label}</strong> {bullet.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>
          ))}

          <section id="pricing-schedule" className={styles.section}>
            <Card>
              <CardHeader>
                <CardTitle className={styles.sectionTitle}>
                  {isPt
                    ? "Tabela Oficial de Taxas & Split Atômico (30% Afiliado / 70% Dev)"
                    : "Official Fee Schedule & Atomic Split (30% Affiliate / 70% Dev)"}
                </CardTitle>
                <CardDescription className={styles.sectionSummary}>
                  {isPt
                    ? "Fonte única de verdade sincronizada automaticamente a partir de src/config/pricing.ts."
                    : "Single source of truth synchronized automatically from src/config/pricing.ts."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid hsl(var(--border))", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem" }}>{isPt ? "Serviço" : "Service"}</th>
                        <th style={{ padding: "0.6rem" }}>{isPt ? "Rota" : "Route"}</th>
                        <th style={{ padding: "0.6rem", textAlign: "right" }}>
                          {isPt ? "Taxa" : "Fee"}
                        </th>
                        <th style={{ padding: "0.6rem", textAlign: "right", color: "#14f195" }}>
                          Aff (30%)
                        </th>
                        <th style={{ padding: "0.6rem", textAlign: "right", color: "#c4b5fd" }}>
                          Dev (70%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRICING_SCHEDULE_TABLE.map((item) => {
                        const feeText =
                          isPt && item.feeDisplayPt ? item.feeDisplayPt : item.feeDisplay;
                        const affiliateText = item.isPercentageRate
                          ? isPt
                            ? item.affiliateDisplayPt || "30% da taxa (2.4%)"
                            : item.affiliateDisplayEn || "30% of fee (2.4%)"
                          : `${formatSolAmount(item.affiliateSol, 3, 4)} SOL`;
                        const devText = item.isPercentageRate
                          ? isPt
                            ? item.devWalletDisplayPt || "70% da taxa (5.6%)"
                            : item.devWalletDisplayEn || "70% of fee (5.6%)"
                          : `${formatSolAmount(item.devWalletSol, 3, 4)} SOL`;

                        return (
                          <tr
                            key={item.id}
                            style={{ borderBottom: "1px solid hsla(var(--border), 0.45)" }}
                          >
                            <td style={{ padding: "0.55rem 0.6rem" }}>
                              {isPt ? item.defaultNamePt : item.defaultNameEn}
                            </td>
                            <td style={{ padding: "0.55rem 0.6rem", fontFamily: "monospace" }}>
                              {item.route}
                            </td>
                            <td
                              style={{
                                padding: "0.55rem 0.6rem",
                                textAlign: "right",
                                fontFamily: "monospace",
                                fontWeight: 700,
                              }}
                            >
                              {feeText}
                            </td>
                            <td
                              style={{
                                padding: "0.55rem 0.6rem",
                                textAlign: "right",
                                fontFamily: "monospace",
                                color: "#14f195",
                              }}
                            >
                              {affiliateText}
                            </td>
                            <td
                              style={{
                                padding: "0.55rem 0.6rem",
                                textAlign: "right",
                                fontFamily: "monospace",
                                color: "#c4b5fd",
                              }}
                            >
                              {devText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
