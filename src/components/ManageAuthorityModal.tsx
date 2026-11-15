"use client";

import React, { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./ManageAuthorityModal.module.css";
import { Button } from "./ui/button";

export interface ManageAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading: boolean;
}

const ManageAuthorityModal: React.FC<ManageAuthorityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-authority-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <span className={styles.badgeDanger}>{t.common.irreversibleWarning}</span>
        <h3 id="manage-authority-modal-title" className={styles.title}>
          {title}
        </h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={styles.confirmButton}
            disabled={isLoading}
          >
            {isLoading ? t.common.signingAndConfirming : t.common.confirmAndRevoke}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageAuthorityModal;
