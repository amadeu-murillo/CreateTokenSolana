"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type AppLocale = "pt" | "en" | "es";

const PT_TIMEZONES = new Set([
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Manaus",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Bahia",
  "America/Maceio",
  "America/Araguaina",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Rio_Branco",
  "Europe/Lisbon",
  "Atlantic/Azores",
  "Atlantic/Madeira",
]);

const ES_TIMEZONES = new Set([
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Mexico_City",
  "America/Montevideo",
  "America/Caracas",
  "America/Asuncion",
  "America/La_Paz",
  "America/Guayaquil",
  "Europe/Madrid",
]);

/**
 * Automatically detects the user's language based on their origin country timezone and browser locale.
 */
export function detectUserCountryLocale(): AppLocale {
  if (typeof window === "undefined") return "pt";

  try {
    const saved = localStorage.getItem("appLocale") as AppLocale | null;
    if (saved === "pt" || saved === "en" || saved === "es") {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (PT_TIMEZONES.has(tz) || tz.startsWith("America/Sao_Paulo")) {
      return "pt";
    }
    if (ES_TIMEZONES.has(tz) || tz.startsWith("America/Argentina")) {
      return "es";
    }
  } catch {
    // Ignore Intl errors
  }

  const navLangs =
    typeof navigator !== "undefined"
      ? navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language || "pt-BR"]
      : ["pt-BR"];

  for (const lang of navLangs) {
    const lower = (lang || "").toLowerCase();
    if (lower.startsWith("pt")) return "pt";
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("en")) return "en";
  }

  return "pt";
}

export const TRANSLATIONS = {
  pt: {
    nav: {
      createToken: "Criar Token",
      liquidityPool: "Pool de Liquidez",
      burn: "Queimar / Reclaim",
      airdrop: "Airdrop em Massa",
      manage: "Autoridades",
      affiliates: "Afiliados (30%)",
      docs: "Documentação",
    },
    wallet: {
      connect: "Conectar Carteira",
      connecting: "Conectando...",
      copyAddress: "Copiar Endereço",
      copied: "✓ Copiado!",
      changeWallet: "Trocar Carteira",
      viewExplorer: "Ver no Solscan ↗",
      disconnect: "Desconectar Carteira",
      balanceLabel: "Saldo na Rede",
    },
    network: {
      mainnetShort: "Mainnet (Real)",
      devnetShort: "Devnet (Teste)",
      mainnetBannerTitle: "REDE PRINCIPAL ATIVA: SOLANA MAINNET-BETA",
      mainnetBannerDesc:
        "Você está operando em Produção. Todos os tokens, pools e taxas utilizam SOL real na blockchain.",
      devnetBannerTitle: "MODO DE TESTE ATIVO: SOLANA DEVNET (SANDBOX)",
      devnetBannerDesc:
        "Ambiente gratuito de simulação! Tokens criados na Devnet servem para teste e não possuem valor comercial.",
      switchToDevnet: "Testar na Devnet →",
      switchToMainnet: "Ir para Mainnet (Produção) →",
      faucetBtn: "🚰 +1 SOL Grátis (Faucet)",
      faucetLoading: "Enviando +1 SOL...",
      faucetSuccess: "✓ +1 SOL Recebido!",
    },
    home: {
      heroBadgeMainnet: "🟢 Produção On-Chain · Solana Mainnet-Beta",
      heroBadgeDevnet: "🟠 Ambiente de Simulação · Solana Devnet",
      heroTitle: "Crie Seu Token na Solana em Segundos",
      heroSubtitle:
        "Lance tokens SPL ou Token-2022 com blindagem RugCheck 100/100, metadados imutáveis no Arweave e Pool de Liquidez sem precisar programar.",
      costSummaryTitle: "Resumo de Custos (Modular)",
      quickGuideTitle: "Guia Rápido",
      suiteTitle: "Ecossistema Completo para o Seu Token",
      suiteSubtitle:
        "Tudo o que você precisa após criar o token: adicionar liquidez, queimar LP com certificado PNG, recuperar SOL de contas vazias e fazer airdrops.",
      faqTitle: "Perguntas Frequentes (FAQ)",
    },
    form: {
      targetNetwork: "Rede Selecionada:",
      totalModularFee: "Taxa Modular Total:",
      step1: "1. Identidade do Token",
      step2: "2. Logo & Redes Sociais",
      step3: "3. Blindagem & Mint",
      tokenName: "Nome do Token",
      tokenSymbol: "Símbolo (Ticker)",
      decimals: "Casas Decimais (0 – 9)",
      supply: "Supply Inicial Total",
      storagePipeline: "Armazenamento da Logo e Metadados",
      logoLabel: "Logo do Token (PNG, JPG, WEBP, GIF — Máx 5MB)",
      dropzonePrompt: "Arraste e solte a logo do seu token aqui, ou clique para selecionar",
      uploadingImg: "Enviando e verificando imagem...",
      description: "Descrição do Projeto (Opcional)",
      website: "Site Oficial (Opcional)",
      twitter: "X / Twitter (Opcional)",
      instagram: "Instagram (Opcional)",
      customCreatorTitle: "Customizar \"Creator Info\" nos Metadados",
      customCreatorDesc:
        "Substitui a assinatura padrão nos metadados pelo nome e site oficial do seu projeto.",
      creatorName: "Nome do Criador / Estúdio",
      creatorUrl: "Site Oficial do Criador",
      tokenStandard: "Padrão do Programa Solana",
      standardSpl: "SPL Padrão (Compatibilidade Universal)",
      standard2022: "Token-2022 (Extensão Tax Token / Transfer Fee)",
      securityTitle: "Blindagem On-Chain & RugCheck 100/100 (Upsell Modular)",
      revokeFreezeTitle: "Revogar Freeze Authority (Recomendado)",
      revokeFreezeDesc:
        "Obrigatório para criar Pool de Liquidez na Raydium/Meteora e negociar na Jupiter (+50 pts no RugCheck).",
      revokeMintTitle: "Revogar Mint Authority (Recomendado)",
      revokeMintDesc:
        "Torna o Supply 100% fixo e impede a criação de novos tokens (+35 pts no RugCheck).",
      immutableTitle: "Metadados Imutáveis (Immutable)",
      immutableDesc:
        "Trava permanentemente nome, símbolo e imagem nos exploradores (+15 pts no RugCheck).",
      backBtn: "← Voltar",
      continueBtn: "Continuar →",
      submitMainnet: "🚀 Criar Token na Mainnet-Beta",
      submitDevnet: "🧪 Criar Token de Teste na Devnet",
    },
    costs: {
      baseCreate: "Taxa Base de Criação (Token Mint)",
      revokeFreeze: "Revogar Freeze Authority (Pool Ready)",
      revokeMint: "Revogar Mint Authority (Supply Fixo)",
      immutable: "Metadados Imutáveis (Immutable)",
      customCreator: "Customizar Creator Info (Metadados)",
      transferFeeExt: "Extensão Tax Token / Transfer Fee (Token-2022)",
      totalModular: "Total Taxa Modular:",
      networkRent: "Rent da Rede Solana (Estimado):",
      estimatedWalletTotal: "Total Estimado na Carteira:",
      atomicDisclaimer:
        "Cobrança atômica na mesma transação com split instantâneo de 30% para afiliados e 70% para Dev Wallet.",
    },
  },
  en: {
    nav: {
      createToken: "Create Token",
      liquidityPool: "Liquidity Pool",
      burn: "Burn & Reclaim",
      airdrop: "Mass Airdrop",
      manage: "Authorities",
      affiliates: "Affiliates (30%)",
      docs: "Docs",
    },
    wallet: {
      connect: "Connect Wallet",
      connecting: "Connecting...",
      copyAddress: "Copy Address",
      copied: "✓ Copied!",
      changeWallet: "Switch Wallet",
      viewExplorer: "View on Solscan ↗",
      disconnect: "Disconnect Wallet",
      balanceLabel: "Network Balance",
    },
    network: {
      mainnetShort: "Mainnet (Live)",
      devnetShort: "Devnet (Test)",
      mainnetBannerTitle: "LIVE PRODUCTION NETWORK: SOLANA MAINNET-BETA",
      mainnetBannerDesc:
        "You are operating on Mainnet-Beta. All tokens, liquidity pools, and fees use real SOL on-chain.",
      devnetBannerTitle: "TESTNET SANDBOX ACTIVE: SOLANA DEVNET",
      devnetBannerDesc:
        "Free simulation environment! Tokens minted on Devnet are for testing only and carry no monetary value.",
      switchToDevnet: "Switch to Devnet →",
      switchToMainnet: "Switch to Mainnet (Live) →",
      faucetBtn: "🚰 +1 Free Devnet SOL",
      faucetLoading: "Airdropping +1 SOL...",
      faucetSuccess: "✓ +1 SOL Added!",
    },
    home: {
      heroBadgeMainnet: "🟢 Live Production · Solana Mainnet-Beta",
      heroBadgeDevnet: "🟠 Sandbox Test Mode · Solana Devnet",
      heroTitle: "Create Your Solana Token in Seconds",
      heroSubtitle:
        "Launch SPL or Token-2022 assets with 100/100 RugCheck security, permanent Arweave metadata, and instant Liquidity Pools with zero coding.",
      costSummaryTitle: "Modular Cost Breakdown",
      quickGuideTitle: "Quick Guide",
      suiteTitle: "Complete Token Lifecycle Suite",
      suiteSubtitle:
        "Everything you need after minting: initialize liquidity pools, generate PNG burn certificates, reclaim SOL from empty accounts, and run mass airdrops.",
      faqTitle: "Frequently Asked Questions",
    },
    form: {
      targetNetwork: "Active Network:",
      totalModularFee: "Total Modular Fee:",
      step1: "1. Token Identity",
      step2: "2. Logo & Socials",
      step3: "3. Security & Mint",
      tokenName: "Token Name",
      tokenSymbol: "Token Symbol (Ticker)",
      decimals: "Decimals (0 – 9)",
      supply: "Initial Total Supply",
      storagePipeline: "Logo & Metadata Storage Pipeline",
      logoLabel: "Token Logo Image (PNG, JPG, WEBP, GIF — Max 5MB)",
      dropzonePrompt: "Drag & drop your token logo here, or click to select a file",
      uploadingImg: "Uploading & verifying token image...",
      description: "Project Description (Optional)",
      website: "Official Website (Optional)",
      twitter: "X / Twitter (Optional)",
      instagram: "Instagram (Optional)",
      customCreatorTitle: "Customize \"Creator Info\" in Metadata",
      customCreatorDesc:
        "Replaces the default creator signature in metadata with your project or studio name and URL.",
      creatorName: "Creator / Studio Name",
      creatorUrl: "Creator Official Website",
      tokenStandard: "Solana Token Program Standard",
      standardSpl: "Standard SPL (Universal Compatibility)",
      standard2022: "Token-2022 (Tax Token / Transfer Fee Extension)",
      securityTitle: "On-Chain Security & RugCheck 100/100 (Modular Upsell)",
      revokeFreezeTitle: "Revoke Freeze Authority (Recommended)",
      revokeFreezeDesc:
        "Mandatory to initialize Raydium/Meteora Liquidity Pools and trade on Jupiter (+50 RugCheck pts).",
      revokeMintTitle: "Revoke Mint Authority (Recommended)",
      revokeMintDesc:
        "Permanently caps total supply so no extra tokens can ever be minted (+35 RugCheck pts).",
      immutableTitle: "Immutable Metadata",
      immutableDesc:
        "Permanently locks token name, symbol, and image URI on explorers (+15 RugCheck pts).",
      backBtn: "← Back",
      continueBtn: "Continue →",
      submitMainnet: "🚀 Launch Token on Mainnet-Beta",
      submitDevnet: "🧪 Mint Test Token on Devnet",
    },
    costs: {
      baseCreate: "Base Token Creation Fee (Mint)",
      revokeFreeze: "Revoke Freeze Authority (Pool Ready)",
      revokeMint: "Revoke Mint Authority (Fixed Supply)",
      immutable: "Immutable Metadata Lock",
      customCreator: "Custom Creator Info (Metadata)",
      transferFeeExt: "Tax Token / Transfer Fee Ext (Token-2022)",
      totalModular: "Total Modular Fee:",
      networkRent: "Solana Network Rent (Est.):",
      estimatedWalletTotal: "Estimated Wallet Total:",
      atomicDisclaimer:
        "Charged atomically in the same transaction with an instant 30% affiliate / 70% Dev Wallet split.",
    },
  },
  es: {
    nav: {
      createToken: "Crear Token",
      liquidityPool: "Pool de Liquidez",
      burn: "Quemar / Reclaim",
      airdrop: "Airdrop Masivo",
      manage: "Autoridades",
      affiliates: "Afiliados (30%)",
      docs: "Docs",
    },
    wallet: {
      connect: "Conectar Billetera",
      connecting: "Conectando...",
      copyAddress: "Copiar Dirección",
      copied: "✓ ¡Copiado!",
      changeWallet: "Cambiar Billetera",
      viewExplorer: "Ver en Solscan ↗",
      disconnect: "Desconectar Billetera",
      balanceLabel: "Saldo en Red",
    },
    network: {
      mainnetShort: "Mainnet (Real)",
      devnetShort: "Devnet (Prueba)",
      mainnetBannerTitle: "RED PRINCIPAL ACTIVA: SOLANA MAINNET-BETA",
      mainnetBannerDesc:
        "Estás operando en Producción. Todos los tokens, pools y tarifas utilizan SOL real en la blockchain.",
      devnetBannerTitle: "MODO DE PRUEBA ACTIVO: SOLANA DEVNET (SANDBOX)",
      devnetBannerDesc:
        "¡Entorno de simulación gratuito! Los tokens creados en Devnet son solo para pruebas y no tienen valor comercial.",
      switchToDevnet: "Probar en Devnet →",
      switchToMainnet: "Ir a Mainnet (Producción) →",
      faucetBtn: "🚰 +1 SOL Gratis (Faucet)",
      faucetLoading: "Enviando +1 SOL...",
      faucetSuccess: "✓ ¡+1 SOL Recibido!",
    },
    home: {
      heroBadgeMainnet: "🟢 Producción On-Chain · Solana Mainnet-Beta",
      heroBadgeDevnet: "🟠 Modo de Simulación · Solana Devnet",
      heroTitle: "Crea Tu Token en Solana en Segundos",
      heroSubtitle:
        "Lanza tokens SPL o Token-2022 con blindaje RugCheck 100/100, metadatos inmutables en Arweave y Pool de Liquidez sin programar.",
      costSummaryTitle: "Resumen de Costos (Modular)",
      quickGuideTitle: "Guía Rápida",
      suiteTitle: "Ecosistema Completo para Tu Token",
      suiteSubtitle:
        "Todo lo que necesitas tras crear tu token: agregar liquidez, certificado PNG de quema, recuperar SOL de cuentas vacías y airdrops masivos.",
      faqTitle: "Preguntas Frecuentes (FAQ)",
    },
    form: {
      targetNetwork: "Red Seleccionada:",
      totalModularFee: "Tarifa Modular Total:",
      step1: "1. Identidad del Token",
      step2: "2. Logo y Redes",
      step3: "3. Seguridad y Mint",
      tokenName: "Nombre del Token",
      tokenSymbol: "Símbolo (Ticker)",
      decimals: "Decimales (0 – 9)",
      supply: "Suministro Inicial Total",
      storagePipeline: "Almacenamiento de Logo y Metadatos",
      logoLabel: "Logo del Token (PNG, JPG, WEBP, GIF — Máx 5MB)",
      dropzonePrompt: "Arrastra y suelta el logo aquí, o haz clic para seleccionar",
      uploadingImg: "Subiendo y verificando imagen...",
      description: "Descripción del Proyecto (Opcional)",
      website: "Sitio Web Oficial (Opcional)",
      twitter: "X / Twitter (Opcional)",
      instagram: "Instagram (Opcional)",
      customCreatorTitle: "Personalizar \"Creator Info\" en Metadatos",
      customCreatorDesc:
        "Reemplaza la firma predeterminada en los metadatos con el nombre y sitio de tu proyecto.",
      creatorName: "Nombre del Creador / Estudio",
      creatorUrl: "Sitio Oficial del Creador",
      tokenStandard: "Estándar del Programa Solana",
      standardSpl: "SPL Estándar (Compatibilidad Universal)",
      standard2022: "Token-2022 (Extensión Tax Token / Transfer Fee)",
      securityTitle: "Seguridad On-Chain y RugCheck 100/100 (Upsell Modular)",
      revokeFreezeTitle: "Revocar Freeze Authority (Recomendado)",
      revokeFreezeDesc:
        "Obligatorio para crear Pool de Liquidez en Raydium/Meteora y operar en Jupiter (+50 pts RugCheck).",
      revokeMintTitle: "Revocar Mint Authority (Recomendado)",
      revokeMintDesc:
        "Fija el suministro al 100% e impide emitir nuevos tokens (+35 pts RugCheck).",
      immutableTitle: "Metadatos Inmutables (Immutable)",
      immutableDesc:
        "Bloquea permanentemente nombre, símbolo e imagen en los exploradores (+15 pts RugCheck).",
      backBtn: "← Atrás",
      continueBtn: "Continuar →",
      submitMainnet: "🚀 Crear Token en Mainnet-Beta",
      submitDevnet: "🧪 Crear Token de Prueba en Devnet",
    },
    costs: {
      baseCreate: "Tarifa Base de Creación (Token Mint)",
      revokeFreeze: "Revocar Freeze Authority (Pool Ready)",
      revokeMint: "Revocar Mint Authority (Suministro Fijo)",
      immutable: "Metadatos Inmutables (Immutable)",
      customCreator: "Personalizar Creator Info (Metadatos)",
      transferFeeExt: "Extensión Tax Token / Transfer Fee (Token-2022)",
      totalModular: "Total Tarifa Modular:",
      networkRent: "Rent de Red Solana (Est.):",
      estimatedWalletTotal: "Total Estimado en Billetera:",
      atomicDisclaimer:
        "Cobro atómico en la misma transacción con división instantánea de 30% para afiliados y 70% para Dev Wallet.",
    },
  },
} as const;

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (typeof TRANSLATIONS)["pt"];
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "pt",
  setLocale: () => {},
  t: TRANSLATIONS.pt,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<AppLocale>("pt");

  useEffect(() => {
    const detected = detectUserCountryLocale();
    setLocaleState(detected);
    if (typeof document !== "undefined") {
      document.documentElement.lang = detected === "pt" ? "pt-BR" : detected;
    }
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("appLocale", next);
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "pt" ? "pt-BR" : next;
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: TRANSLATIONS[locale] || TRANSLATIONS.pt,
    }),
    [locale, setLocale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
