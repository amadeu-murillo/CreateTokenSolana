"use client";

import React, { useEffect } from "react";
import { useCluster } from "@/context/WalletContext";
import styles from "./Notification.module.css";

const CheckCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const InfoCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.icon}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface NotificationProps {
  type: "success" | "error" | "info";
  message: string;
  signature?: string | null;
  txId?: string | null;
  url?: string | null;
  floating?: boolean;
  autoHideDurationMs?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  signature,
  txId,
  url,
  floating = false,
  autoHideDurationMs,
  onClose,
}) => {
  const { getExplorerUrl } = useCluster();

  const resolvedSignature = signature || txId || null;
  const resolvedExplorerUrl =
    url || (resolvedSignature ? getExplorerUrl("tx", resolvedSignature) : null);

  useEffect(() => {
    if (!autoHideDurationMs || autoHideDurationMs <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoHideDurationMs);
    return () => clearTimeout(timer);
  }, [autoHideDurationMs, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle />;
      case "error":
        return <XCircle />;
      case "info":
        return <InfoCircle />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "success":
        return "Transação Confirmada";
      case "error":
        return "Alerta de Execução";
      default:
        return "Status da Rede";
    }
  };

  const cardElement = (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.notification} ${styles[type]}`}
    >
      <div className={styles.iconWrapper}>{getIcon()}</div>
      <div className={styles.content}>
        <div className={styles.titleRow}>{getLabel()}</div>
        <p className={styles.message}>{message}</p>
        {type === "success" && resolvedExplorerUrl && (
          <a
            href={resolvedExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <span>Ver no Solscan</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Fechar notificação"
      >
        <CloseIcon />
      </button>
    </div>
  );

  if (floating) {
    return <div className={styles.toastViewport}>{cardElement}</div>;
  }

  return cardElement;
};

export default Notification;
