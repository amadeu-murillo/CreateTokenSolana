"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CREATE_TOKEN_FEE_SOL,
  PRICING_SOL,
  computeSplit,
} from "@/config/pricing";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy } from "@/i18n/affiliates";
import styles from "@/app/affiliates/Affiliates.module.css";

interface CalculatorServiceOption {
  id: string;
  labelEn: string;
  labelPt: string;
  labelEs: string;
  feeSol: number;
  isPopular?: boolean;
  isReclaimExample?: boolean;
}

export const CALCULATOR_MAX_REFERRALS = 500;
const QUICK_PRESETS = [5, 15, 50, 100] as const;

export const CALCULATOR_SERVICES: ReadonlyArray<CalculatorServiceOption> = [
  {
    id: "createTokenRecommended",
    labelEn: "Token Creation — Standard + Revocations (0.35 SOL)",
    labelPt: "Criação de Token — Padrão + Revogações (0,35 SOL)",
    labelEs: "Creación de Token — Estándar + Revocaciones (0,35 SOL)",
    feeSol: DEFAULT_CREATE_TOKEN_FEE_SOL,
    isPopular: true,
  },
  {
    id: "createLiquidityPool",
    labelEn: "Raydium CPMM Liquidity Pool (0.07 SOL)",
    labelPt: "Pool de Liquidez Raydium CPMM (0,07 SOL)",
    labelEs: "Pool de Liquidez Raydium CPMM (0,07 SOL)",
    feeSol: PRICING_SOL.createLiquidityPool,
    isPopular: true,
  },
  {
    id: "volumeBotGrowth300",
    labelEn: "Volume Bot — 300 Makers (0.12 SOL)",
    labelPt: "Volume Bot — 300 Makers (0,12 SOL)",
    labelEs: "Volume Bot — 300 Makers (0,12 SOL)",
    feeSol: PRICING_SOL.volumeBotGrowth300,
    isPopular: true,
  },
  {
    id: "baseMint",
    labelEn: "Base Mint (0.10 SOL)",
    labelPt: "Mint Base (0,10 SOL)",
    labelEs: "Mint Base (0,10 SOL)",
    feeSol: PRICING_SOL.baseMint,
  },
  {
    id: "volumeBotStarter100",
    labelEn: "Volume Bot — 100 Makers (0.05 SOL)",
    labelPt: "Volume Bot — 100 Makers (0,05 SOL)",
    labelEs: "Volume Bot — 100 Makers (0,05 SOL)",
    feeSol: PRICING_SOL.volumeBotStarter100,
  },
  {
    id: "volumeBotTrending750",
    labelEn: "Volume Bot — 750 Makers (0.25 SOL)",
    labelPt: "Volume Bot — 750 Makers (0,25 SOL)",
    labelEs: "Volume Bot — 750 Makers (0,25 SOL)",
    feeSol: PRICING_SOL.volumeBotTrending750,
  },
  {
    id: "tokenVestingLock",
    labelEn: "Token Vesting / LP Lock (0.10 SOL)",
    labelPt: "Token Vesting / LP Lock (0,10 SOL)",
    labelEs: "Token Vesting / LP Lock (0,10 SOL)",
    feeSol: PRICING_SOL.tokenVestingLock,
  },
  {
    id: "massAirdropPerBatch",
    labelEn: "Mass Airdrop per batch (0.07 SOL)",
    labelPt: "Airdrop em Massa por lote (0,07 SOL)",
    labelEs: "Airdrop Masivo por lote (0,07 SOL)",
    feeSol: PRICING_SOL.massAirdropPerBatch,
  },
  {
    id: "revokeAuthorityStandalone",
    labelEn: "Standalone Authority Revocation (0.07 SOL)",
    labelPt: "Revogação Avulsa de Autoridade (0,07 SOL)",
    labelEs: "Revocación de Autoridad (0,07 SOL)",
    feeSol: PRICING_SOL.revokeAuthorityStandalone,
  },
  {
    id: "reclaimExample",
    labelEn: "Reclaim SOL — 8% fee (0.50 SOL example)",
    labelPt: "Reclaim SOL — taxa 8% (exemplo 0,50 SOL)",
    labelEs: "Reclaim SOL — tarifa 8% (ejemplo 0,50 SOL)",
    feeSol: Number((0.5 * PRICING_SOL.reclaimSolPlatformFeeRate).toFixed(6)),
    isReclaimExample: true,
  },
];

export function calculateIllustrativeAffiliateEarnings(
  feeSol: number,
  monthlyReferrals: number,
  solPriceUsd: number | null = null
): {
  perReferralSol: number;
  monthlySol: number;
  monthlyUsd: number | null;
} {
  const safeCount = Math.max(
    0,
    Math.min(CALCULATOR_MAX_REFERRALS, Math.floor(Number(monthlyReferrals) || 0))
  );
  const { affiliateSol } = computeSplit(feeSol);
  const monthlySol = Number((affiliateSol * safeCount).toFixed(4));
  const monthlyUsd =
    typeof solPriceUsd === "number" && solPriceUsd > 0
      ? Number((monthlySol * solPriceUsd).toFixed(2))
      : null;

  return {
    perReferralSol: affiliateSol,
    monthlySol,
    monthlyUsd,
  };
}

export default function EarningsCalculator() {
  const { locale } = useLanguage();
  const copy = getAffiliateCopy(locale);

  const [selectedServiceId, setSelectedServiceId] = useState(CALCULATOR_SERVICES[0].id);
  const [referralsPerMonth, setReferralsPerMonth] = useState(15);
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/sol-price")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && typeof data?.usd === "number" && data.usd > 0) {
          setSolPriceUsd(data.usd);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const popularChips = [
    { id: "createTokenRecommended", label: copy.calcChipCreate },
    { id: "createLiquidityPool", label: copy.calcChipPool },
    { id: "volumeBotGrowth300", label: copy.calcChipVolume },
  ];

  const otherServices = useMemo(
    () => CALCULATOR_SERVICES.filter((s) => !s.isPopular),
    []
  );

  const selectedService = useMemo(
    () => CALCULATOR_SERVICES.find((s) => s.id === selectedServiceId) ?? CALCULATOR_SERVICES[0],
    [selectedServiceId]
  );

  const result = useMemo(
    () =>
      calculateIllustrativeAffiliateEarnings(
        selectedService.feeSol,
        referralsPerMonth,
        solPriceUsd
      ),
    [selectedService.feeSol, referralsPerMonth, solPriceUsd]
  );

  const getOptionLabel = (service: CalculatorServiceOption) => {
    if (locale === "pt" || locale === "pt-BR") return service.labelPt;
    if (locale === "es") return service.labelEs;
    return service.labelEn;
  };

  const formatNumber = (val: number, maxFractionDigits = 4) =>
    new Intl.NumberFormat(copy.numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxFractionDigits,
    }).format(val);

  const formatUsd = (val: number) =>
    new Intl.NumberFormat(copy.numberLocale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val);

  const isOtherSelected = otherServices.some((s) => s.id === selectedServiceId);

  return (
    <section
      id="calculator"
      aria-labelledby="calculator-heading"
      className={styles.dataSection}
    >
      <div className={styles.sectionHeader}>
        <h2 id="calculator-heading" className={styles.sectionTitle}>
          {copy.calculatorTitle}
        </h2>
        <p className={styles.sectionSubtitle}>{copy.calculatorSubtitle}</p>
      </div>

      <div className={styles.calculatorGrid}>
        <div className={styles.calculatorControls}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>{copy.calculatorPopularLabel}</span>
            <div className={styles.chipGrid} role="group" aria-label={copy.calculatorPopularLabel}>
              {popularChips.map((chip) => {
                const active = selectedServiceId === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedServiceId(chip.id)}
                    className={`${styles.serviceChip} ${
                      active ? styles.serviceChipActive : ""
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="calc-other-service" className={styles.fieldLabel}>
              {copy.calculatorOtherServicesLabel}
            </label>
            <select
              id="calc-other-service"
              value={isOtherSelected ? selectedServiceId : ""}
              onChange={(e) => {
                if (e.target.value) setSelectedServiceId(e.target.value);
              }}
              className={styles.selectInput}
            >
              <option value="">{copy.calculatorOtherPlaceholder}</option>
              {otherServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {getOptionLabel(service)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.rangeHeader}>
              <label htmlFor="calc-referrals-range" className={styles.fieldLabel}>
                {copy.calculatorReferralsLabel}{" "}
                <span className={styles.helperNote}>({copy.calculatorMaxHint})</span>
              </label>
              <input
                aria-label={copy.calculatorReferralsLabel}
                type="number"
                min={1}
                max={CALCULATOR_MAX_REFERRALS}
                value={referralsPerMonth}
                onChange={(e) =>
                  setReferralsPerMonth(
                    Math.max(1, Math.min(CALCULATOR_MAX_REFERRALS, Number(e.target.value) || 1))
                  )
                }
                className={styles.numberInput}
              />
            </div>

            <input
              id="calc-referrals-range"
              type="range"
              min={1}
              max={CALCULATOR_MAX_REFERRALS}
              value={referralsPerMonth}
              onChange={(e) => setReferralsPerMonth(Number(e.target.value))}
              className={styles.rangeInput}
            />

            <div className={styles.presetRow} role="group" aria-label={copy.calculatorPresetsLabel}>
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReferralsPerMonth(preset)}
                  aria-pressed={referralsPerMonth === preset}
                  className={`${styles.presetBtn} ${
                    referralsPerMonth === preset ? styles.presetBtnActive : ""
                  }`}
                >
                  {preset}×
                </button>
              ))}
            </div>
          </div>

          {selectedService.isReclaimExample && (
            <p className={styles.helperNote}>{copy.calculatorReclaimNote}</p>
          )}
        </div>

        <div className={styles.calculatorResultBox} aria-live="polite">
          <span className={styles.resultKicker}>{copy.calculatorOutputLabel}</span>
          <div className={styles.resultHeroRow}>
            <p className={styles.resultPrimary}>{formatNumber(result.monthlySol, 4)} SOL</p>
            {result.monthlyUsd !== null && (
              <p className={styles.resultSecondary}>
                ≈ {formatUsd(result.monthlyUsd)}{" "}
                <span className={styles.helperNote}>({copy.calculatorUsdNote})</span>
              </p>
            )}
          </div>
          <p className={styles.resultBreakdown}>
            {copy.calculatorPerReferralLabel}:{" "}
            <strong>{formatNumber(result.perReferralSol, 4)} SOL</strong>
          </p>
          <p className={styles.disclaimerText}>{copy.calculatorDisclaimer}</p>
        </div>
      </div>
    </section>
  );
}
