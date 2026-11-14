"use client";

import React from "react";
import { useCluster } from "@/context/WalletContext";
import styles from "./TransactionStatusStepper.module.css";

export interface StepDefinition {
  id: number;
  label: string;
}

export interface TransactionStatusStepperProps {
  isActive: boolean;
  currentStepIndex: number; // 1 to 4
  statusMessage?: string | null;
  operationTitle?: string;
  steps?: StepDefinition[];
}

export const DEFAULT_TOKEN_CREATION_STEPS: StepDefinition[] = [
  { id: 1, label: "1. Upload para Irys" },
  { id: 2, label: "2. Upload de Metadados" },
  { id: 3, label: "3. Aguardando Assinatura" },
  { id: 4, label: "4. Confirmando na Rede" },
];

const SpinnerIcon = () => (
  <svg
    className={styles.spinnerSvg}
     xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeDasharray="42"
      strokeDashoffset="14"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className={styles.checkSvg}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function TransactionStatusStepper({
  isActive,
  currentStepIndex,
  statusMessage = null,
  operationTitle = "Progresso da Transação Solana",
  steps = DEFAULT_TOKEN_CREATION_STEPS,
}: TransactionStatusStepperProps) {
  const { cluster } = useCluster();
  const isDevnet = cluster === "devnet";

  if (!isActive && !statusMessage) {
    return null;
  }

  const totalSteps = steps.length;
  const clampedStep = Math.min(Math.max(currentStepIndex || 1, 1), totalSteps);
  const progressPercent = Math.round((clampedStep / totalSteps) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.stepperContainer} ${isDevnet ? styles.stepperContainerDevnet : ""}`}
    >
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <span className={`${styles.liveDot} ${isDevnet ? styles.liveDotDevnet : ""}`} />
          <strong className={styles.operationTitle}>{operationTitle}</strong>
        </div>
        <span className={styles.stepCounterBadge}>
          Etapa {clampedStep}/{totalSteps} · {progressPercent}%
        </span>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${isDevnet ? styles.progressFillDevnet : ""}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className={styles.stepsGrid}>
        {steps.map((step) => {
          const isCompleted = clampedStep > step.id;
          const isCurrent = clampedStep === step.id;

          return (
            <div
              key={step.id}
              className={`${styles.stepCard} ${
                isCurrent
                  ? styles.stepCardActive
                  : isCompleted
                  ? styles.stepCardCompleted
                  : ""
              }`}
            >
              <span className={styles.iconBox}>
                {isCompleted ? (
                  <CheckIcon />
                ) : isCurrent ? (
                  <SpinnerIcon />
                ) : (
                  <span className={styles.pendingDot} />
                )}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {statusMessage && <p className={styles.statusDetail}>{statusMessage}</p>}
    </div>
  );
}
