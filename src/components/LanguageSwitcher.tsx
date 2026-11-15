"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useLanguage,
  SUPPORTED_APP_LOCALES,
  SupportedLocale,
} from "@/context/LanguageContext";
import styles from "./LanguageSwitcher.module.css";

const GlobeIcon = () => (
  <svg
    className={styles.globeIcon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Minimalist Swiss-Design / Vercel-style Language Switcher.
 * - Mobile (< 768px): Displays short code only (EN, PT, ES, ZH, RU) to preserve header space.
 * - Desktop (>= 768px): Displays full native name + code badge.
 */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption =
    SUPPORTED_APP_LOCALES.find((opt) => opt.code === locale) || SUPPORTED_APP_LOCALES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectLocale = (nextLocale: SupportedLocale) => {
    setLocale(nextLocale);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.triggerButton} ${isOpen ? styles.triggerButtonActive : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language (${activeOption.nativeName})`}
      >
        <GlobeIcon />
        {/* Mobile: short code only (EN, PT, ES, ZH, RU) */}
        <span className={styles.mobileShortCode}>{activeOption.shortLabel}</span>

        {/* Desktop: full native name + short code */}
        <span className={styles.desktopLabel}>
          <span>{activeOption.nativeName}</span>
          <span className={styles.desktopCodeBadge}>{activeOption.shortLabel}</span>
        </span>

        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox" aria-label="Supported Languages">
          {SUPPORTED_APP_LOCALES.map((option) => {
            const isSelected = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLocale(option.code)}
                className={isSelected ? styles.optionItemSelected : styles.optionItem}
              >
                <span className={styles.optionLeft}>
                  <span className={styles.optionFlag}>{option.flag}</span>
                  <span>{option.nativeName}</span>
                </span>
                <span className={styles.optionCode}>{option.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
