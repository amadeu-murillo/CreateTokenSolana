import { PRICING_SOL, RECLAIM_NET_USER_RATE, formatSolAmount } from "@/config/pricing";

export type ReferralToolId = "create" | "reclaim" | "liquidity" | "vesting";
export type ReferralLang = "en" | "pt-BR" | "es";

export interface ReferralCampaignCopy {
  tabLabel: string;
  badge: string;
  ogTitle: string;
  ogSubtitle: string;
  ogHighlight: string;
  metaTitle: string;
  metaDescription: string;
  sharePitch: string;
}

export interface ReferralCampaign {
  id: ReferralToolId;
  targetPath: string;
  accentColor: string;
  en: ReferralCampaignCopy;
  "pt-BR": ReferralCampaignCopy;
  es: ReferralCampaignCopy;
}

const baseMintStr = formatSolAmount(PRICING_SOL.baseMint);
const lpFeeStr = formatSolAmount(PRICING_SOL.createLiquidityPool);
const vestingFeeStr = formatSolAmount(PRICING_SOL.tokenVestingLock);
const reclaimNetPct = Math.round(RECLAIM_NET_USER_RATE * 100);

export const REFERRAL_CAMPAIGNS: Record<ReferralToolId, ReferralCampaign> = {
  create: {
    id: "create",
    targetPath: "/",
    accentColor: "#14F195",
    en: {
      tabLabel: "Token Creator",
      badge: `From ${baseMintStr} SOL · No Code`,
      ogTitle: "Launch Your Solana Token in Under 60 Seconds",
      ogSubtitle:
        "Create SPL or Token-2022 assets with optional Mint/Freeze revocation and permanent Arweave metadata — 100% non-custodial.",
      ogHighlight: `Starting at ${baseMintStr} SOL`,
      metaTitle: `Launch a Solana Token Without Code (From ${baseMintStr} SOL) | CreateTokenSolana`,
      metaDescription: `Create SPL & Token-2022 tokens on Solana in under 60s. Non-custodial, transparent fees from ${baseMintStr} SOL, and optional authority revocations.`,
      sharePitch: `Launching a token on Solana? Create SPL or Token-2022 tokens in under 60s with no code and transparent fees from ${baseMintStr} SOL (100% non-custodial).\n\nTry it here (affiliate link): {url}`,
    },
    "pt-BR": {
      tabLabel: "Criar Token",
      badge: `A partir de ${baseMintStr} SOL · Sem Código`,
      ogTitle: "Crie seu Token na Solana em Menos de 60 Segundos",
      ogSubtitle:
        "Lance tokens SPL ou Token-2022 com revogação opcional de Mint/Freeze e metadados no Arweave — 100% não-custodial.",
      ogHighlight: `A partir de ${baseMintStr} SOL`,
      metaTitle: `Crie um Token Solana Sem Programar (${baseMintStr} SOL) | CreateTokenSolana`,
      metaDescription: `Crie tokens SPL e Token-2022 na Solana em menos de 60s. Interface não-custodial, taxas transparentes a partir de ${baseMintStr} SOL e revogação de autoridades.`,
      sharePitch: `Vai lançar um token na Solana? Crie tokens SPL ou Token-2022 sem programar em menos de 60s, com taxas transparentes a partir de ${baseMintStr} SOL (100% não-custodial).\n\nAcesse por aqui (link de afiliado): {url}`,
    },
    es: {
      tabLabel: "Crear Token",
      badge: `Desde ${baseMintStr} SOL · Sin Código`,
      ogTitle: "Crea tu Token en Solana en Menos de 60 Segundos",
      ogSubtitle:
        "Lanza tokens SPL o Token-2022 con revocación opcional de Mint/Freeze y metadatos permanentes en Arweave — 100% no custodial.",
      ogHighlight: `Desde ${baseMintStr} SOL`,
      metaTitle: `Crea un Token en Solana Sin Código (${baseMintStr} SOL) | CreateTokenSolana`,
      metaDescription: `Crea tokens SPL y Token-2022 en Solana en menos de 60s. Interfaz no custodial, tarifas transparentes desde ${baseMintStr} SOL y revocación de autoridades.`,
      sharePitch: `¿Vas a lanzar un token en Solana? Crea tokens SPL o Token-2022 sin programar en menos de 60s con tarifas transparentes desde ${baseMintStr} SOL (100% no custodial).\n\nPruébalo aquí (enlace de afiliado): {url}`,
    },
  },
  reclaim: {
    id: "reclaim",
    targetPath: "/reclaim",
    accentColor: "#38BDF8",
    en: {
      tabLabel: "Reclaim SOL",
      badge: `Keep ${reclaimNetPct}% Net · Free Scan`,
      ogTitle: "Recover Locked SOL from Empty Token Accounts",
      ogSubtitle:
        "Scan your Solana wallet for zero-balance SPL & Token-2022 accounts, close empty ATAs in batches, and keep 92% net SOL.",
      ogHighlight: `Keep ${reclaimNetPct}% Net SOL`,
      metaTitle: `Recover Locked SOL from Empty Accounts (${reclaimNetPct}% Net) | CreateTokenSolana`,
      metaDescription: `Scan your Solana wallet for empty token accounts and reclaim ~0.00204 SOL per closed ATA. Non-custodial, zero upfront fee, keep ${reclaimNetPct}% net.`,
      sharePitch: `Did you know empty Solana token accounts lock ~0.00204 SOL each? Scan your wallet and close zero-balance accounts non-custodially — you keep ${reclaimNetPct}% net SOL.\n\nCheck your wallet (affiliate link): {url}`,
    },
    "pt-BR": {
      tabLabel: "Recuperar SOL",
      badge: `${reclaimNetPct}% Líquido · Scan Gratuito`,
      ogTitle: "Recupere SOL Preso em Contas Vazias da Solana",
      ogSubtitle:
        "Escaneie sua carteira em busca de contas SPL/Token-2022 zeradas, feche ATAs vazias em lote e fique com 92% líquido em SOL.",
      ogHighlight: `${reclaimNetPct}% Líquido para Você`,
      metaTitle: `Recupere SOL de Contas Vazias na Solana (${reclaimNetPct}% Líquido) | CreateTokenSolana`,
      metaDescription: `Escaneie sua carteira Solana para fechar contas de token zeradas e recuperar ~0,00204 SOL por conta. Sem taxa antecipada, ${reclaimNetPct}% líquido na sua carteira.`,
      sharePitch: `Sabia que cada conta de token vazia na sua carteira Solana prende ~0,00204 SOL? Escaneie e feche contas zeradas sem custódia — você fica com ${reclaimNetPct}% líquido.\n\nFaça o scan aqui (link de afiliado): {url}`,
    },
    es: {
      tabLabel: "Recuperar SOL",
      badge: `${reclaimNetPct}% Neto · Escaneo Gratis`,
      ogTitle: "Recupera SOL Bloqueado en Cuentas Vacías de Solana",
      ogSubtitle:
        "Escanea tu billetera en busca de cuentas SPL/Token-2022 con saldo cero, cierra ATAs vacías por lotes y conserva el 92% neto en SOL.",
      ogHighlight: `Conserva ${reclaimNetPct}% Neto`,
      metaTitle: `Recuperar SOL de Cuentas Vacías en Solana (${reclaimNetPct}% Neto) | CreateTokenSolana`,
      metaDescription: `Escanea tu billetera Solana para cerrar cuentas de token vacías y recuperar ~0,00204 SOL por cuenta. Sin tarifa inicial, ${reclaimNetPct}% neto para ti.`,
      sharePitch: `¿Sabías que cada cuenta de token vacía en Solana bloquea ~0,00204 SOL? Escanea y cierra cuentas en cero sin custodia — conservas el ${reclaimNetPct}% neto.\n\nRevisa tu billetera aquí (enlace de afiliado): {url}`,
    },
  },
  liquidity: {
    id: "liquidity",
    targetPath: "/add-liquidity",
    accentColor: "#A855F7",
    en: {
      tabLabel: "Liquidity Pool",
      badge: `Flat ${lpFeeStr} SOL · Raydium CPMM`,
      ogTitle: "Create a Raydium CPMM Liquidity Pool on Solana",
      ogSubtitle:
        "Initialize on-chain liquidity pools with automatic WSOL wrapping and transparent flat service fees — non-custodial.",
      ogHighlight: `Flat ${lpFeeStr} SOL Fee`,
      metaTitle: `Create a Raydium CPMM Liquidity Pool (${lpFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Launch a Raydium CPMM liquidity pool on Solana for a flat ${lpFeeStr} SOL platform fee with automatic WSOL wrapping and client-side simulation.`,
      sharePitch: `Need to open trading for your Solana token? Create a Raydium CPMM liquidity pool non-custodially with a flat ${lpFeeStr} SOL service fee.\n\nOpen your pool here (affiliate link): {url}`,
    },
    "pt-BR": {
      tabLabel: "Pool Raydium",
      badge: `Taxa Fixa ${lpFeeStr} SOL · Raydium CPMM`,
      ogTitle: "Crie sua Pool de Liquidez Raydium CPMM na Solana",
      ogSubtitle:
        "Inicialize pools on-chain com wrapping automático de WSOL e taxa de serviço transparente — 100% não-custodial.",
      ogHighlight: `Taxa Fixa de ${lpFeeStr} SOL`,
      metaTitle: `Criar Pool de Liquidez Raydium CPMM (${lpFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Abra uma pool de liquidez Raydium CPMM na Solana por taxa fixa de ${lpFeeStr} SOL, com wrapping automático de WSOL e simulação antes de assinar.`,
      sharePitch: `Precisa abrir liquidez para o seu token na Solana? Crie sua pool Raydium CPMM sem custódia com taxa fixa de ${lpFeeStr} SOL.\n\nCrie sua pool aqui (link de afiliado): {url}`,
    },
    es: {
      tabLabel: "Pool Raydium",
      badge: `Tarifa Fija ${lpFeeStr} SOL · Raydium CPMM`,
      ogTitle: "Crea tu Pool de Liquidez Raydium CPMM en Solana",
      ogSubtitle:
        "Inicializa pools on-chain con wrapping automático de WSOL y tarifa de servicio fija transparente — 100% no custodial.",
      ogHighlight: `Tarifa Fija ${lpFeeStr} SOL`,
      metaTitle: `Crear Pool de Liquidez Raydium CPMM (${lpFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Abre un pool de liquidez Raydium CPMM en Solana por una tarifa fija de ${lpFeeStr} SOL, con WSOL automático y simulación previa.`,
      sharePitch: `¿Necesitas abrir liquidez para tu token en Solana? Crea tu pool Raydium CPMM sin custodia por una tarifa fija de ${lpFeeStr} SOL.\n\nAbre tu pool aquí (enlace de afiliado): {url}`,
    },
  },
  vesting: {
    id: "vesting",
    targetPath: "/vesting",
    accentColor: "#F59E0B",
    en: {
      tabLabel: "Vesting & Lock",
      badge: `Flat ${vestingFeeStr} SOL · On-Chain Proof`,
      ogTitle: "Lock Team or LP Tokens On-Chain with Vesting Proof",
      ogSubtitle:
        "Lock SPL, Token-2022, or LP tokens in an on-chain escrow vault and export a verifiable lock certificate.",
      ogHighlight: `Flat ${vestingFeeStr} SOL Fee`,
      metaTitle: `Lock Solana Tokens & LP On-Chain (${vestingFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Build community trust by locking team or LP tokens on-chain for ${vestingFeeStr} SOL with SPL Memo proof and exportable PNG certificate.`,
      sharePitch: `Show transparent tokenomics on Solana: lock team or LP tokens on-chain with verifiable proof for ${vestingFeeStr} SOL (non-custodial).\n\nCreate a lock here (affiliate link): {url}`,
    },
    "pt-BR": {
      tabLabel: "Vesting & Lock",
      badge: `Taxa Fixa ${vestingFeeStr} SOL · Prova On-Chain`,
      ogTitle: "Tranque Tokens de Equipe ou LP On-Chain com Prova",
      ogSubtitle:
        "Bloqueie tokens SPL, Token-2022 ou LP em cofre on-chain verificável e gere certificado PNG para sua comunidade.",
      ogHighlight: `Taxa Fixa de ${vestingFeeStr} SOL`,
      metaTitle: `Trancar Tokens e LP na Solana On-Chain (${vestingFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Dê transparência ao seu projeto trancando tokens de equipe ou LP on-chain por ${vestingFeeStr} SOL com registro verificável e certificado PNG.`,
      sharePitch: `Mostre transparência no seu projeto Solana: tranque tokens de equipe ou LP on-chain com prova verificável por ${vestingFeeStr} SOL (não-custodial).\n\nConfigure aqui (link de afiliado): {url}`,
    },
    es: {
      tabLabel: "Vesting y Lock",
      badge: `Tarifa Fija ${vestingFeeStr} SOL · Prueba On-Chain`,
      ogTitle: "Bloquea Tokens de Equipo o LP On-Chain con Prueba",
      ogSubtitle:
        "Bloquea tokens SPL, Token-2022 o LP en una bóveda on-chain verificable y exporta un certificado PNG para tu comunidad.",
      ogHighlight: `Tarifa Fija ${vestingFeeStr} SOL`,
      metaTitle: `Bloquear Tokens y LP en Solana On-Chain (${vestingFeeStr} SOL) | CreateTokenSolana`,
      metaDescription: `Aporta transparencia bloqueando tokens de equipo o LP on-chain por ${vestingFeeStr} SOL con prueba verificable y certificado PNG.`,
      sharePitch: `Demuestra transparencia en tu proyecto Solana: bloquea tokens de equipo o LP on-chain con prueba verificable por ${vestingFeeStr} SOL (no custodial).\n\nConfigúralo aquí (enlace de afiliado): {url}`,
    },
  },
};

export const REFERRAL_TOOL_ORDER: ReadonlyArray<ReferralToolId> = [
  "create",
  "reclaim",
  "liquidity",
  "vesting",
];

export function normalizeReferralTool(raw?: string | null): ReferralToolId {
  if (raw === "reclaim" || raw === "liquidity" || raw === "vesting" || raw === "create") {
    return raw;
  }
  return "create";
}

export function normalizeReferralLang(raw?: string | null): ReferralLang {
  if (!raw) return "en";
  const lower = raw.toLowerCase();
  if (lower === "pt" || lower === "pt-br" || lower.startsWith("pt-")) {
    return "pt-BR";
  }
  if (lower === "es" || lower.startsWith("es-")) {
    return "es";
  }
  return "en";
}
