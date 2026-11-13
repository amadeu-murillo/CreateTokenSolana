"use client";

import React from "react";

export interface TransactionStatusStepperProps {
  isActive: boolean;
  currentStepIndex: number; // 1 to 5
  statusMessage: string | null;
  operationTitle?: string;
}

const DEFAULT_STAGES = [
  { id: 1, label: "Validate & Build TX" },
  { id: 2, label: "Security & RPC Sim" },
  { id: 3, label: "Wallet Signature" },
  { id: 4, label: "On-Chain Finality" },
  { id: 5, label: "Complete" },
];

export default function TransactionStatusStepper({
  isActive,
  currentStepIndex,
  statusMessage,
  operationTitle = "On-Chain Transaction Progress",
}: TransactionStatusStepperProps) {
  if (!isActive && !statusMessage) return null;

  const clampedStep = Math.min(Math.max(currentStepIndex || 1, 1), 5);
  const progressPercent = Math.round((clampedStep / DEFAULT_STAGES.length) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: "1.1rem 1.25rem",
        borderRadius: "0.875rem",
        background: "hsla(var(--card), 0.96)",
        border: "1px solid hsla(var(--primary), 0.45)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.28)",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 10px #10b981",
              display: "inline-block",
              animation: "pulseGlow 1.4s infinite ease-in-out",
            }}
          />
          <strong style={{ fontSize: "0.86rem", color: "hsl(var(--foreground))" }}>
            {operationTitle}
          </strong>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "JetBrains Mono, monospace",
            color: "#34d399",
            background: "rgba(16, 185, 129, 0.14)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "0.18rem 0.55rem",
            borderRadius: "999px",
          }}
        >
          Step {clampedStep} of {DEFAULT_STAGES.length} ({progressPercent}%)
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "6px",
          backgroundColor: "hsl(var(--muted))",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            backgroundImage: "var(--primary-gradient)",
            transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* Current Step Description */}
      <p
        style={{
          fontSize: "0.82rem",
          color: "hsl(var(--foreground))",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {statusMessage || "Processing transaction on Solana..."}
      </p>

      {/* 5-Stage Pill Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "0.4rem",
        }}
      >
        {DEFAULT_STAGES.map((stage) => {
          const isDone = clampedStep > stage.id;
          const isCurrent = clampedStep === stage.id;
          return (
            <div
              key={stage.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.55rem",
                borderRadius: "0.5rem",
                fontSize: "0.72rem",
                fontWeight: isCurrent ? 700 : 500,
                background: isCurrent
                  ? "hsla(var(--primary), 0.18)"
                  : isDone
                  ? "rgba(16, 185, 129, 0.12)"
                  : "hsla(var(--muted), 0.5)",
                border: isCurrent
                  ? "1px solid hsla(var(--primary), 0.5)"
                  : isDone
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : "1px solid hsl(var(--border))",
                color: isCurrent
                  ? "hsl(var(--foreground))"
                  : isDone
                  ? "#34d399"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              <span>{isDone ? "✓" : `${stage.id}.`}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
