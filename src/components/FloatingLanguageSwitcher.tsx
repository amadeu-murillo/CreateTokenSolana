"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useLanguage,
  SUPPORTED_LOCALES,
  normalizeLocale,
  type SupportedLocale,
} from "@/context/LanguageContext";

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const ChevronUpIcon = ({ className, isOpen }: { className?: string; isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    }}
    aria-hidden="true"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Minimalist Vercel / Swiss Design Floating Action Button (FAB) Language Switcher.
 * Fixed in the bottom-right corner (`bottom-5 right-5 z-50`) to keep the main Navbar
 * 100% focused on conversion (Mint Token & Connect Wallet).
 *
 * Styled with Tailwind CSS utility classes + resilient inline fallbacks for hybrid CSS-Module setups.
 */
export default function FloatingLanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCode: SupportedLocale = normalizeLocale(locale) ?? "en";
  const currentLang =
    SUPPORTED_LOCALES.find((item) => item.code === activeCode) ?? SUPPORTED_LOCALES[0];

  // Close popover when clicking outside or pressing Escape
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectLocale = (code: SupportedLocale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans select-none"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {/* Upward Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select application language"
          className="mb-2.5 w-48 overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/95 p-1.5 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-200"
          style={{
            marginBottom: "0.625rem",
            width: "12.5rem",
            borderRadius: "0.85rem",
            border: "1px solid rgba(30, 41, 59, 0.92)",
            backgroundColor: "rgba(9, 9, 11, 0.94)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: "0.375rem",
            boxShadow:
              "0 20px 45px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 24px rgba(20, 241, 149, 0.08)",
          }}
        >
          <div
            className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 mb-1"
            style={{
              padding: "0.35rem 0.625rem",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#94a3b8",
              borderBottom: "1px solid rgba(30, 41, 59, 0.8)",
              marginBottom: "0.25rem",
            }}
          >
            Global Language
          </div>

          <div className="flex flex-col gap-0.5" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {SUPPORTED_LOCALES.map((item) => {
              const isSelected = item.code === activeCode;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLocale(item.code)}
                  className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: "0.55rem",
                    padding: "0.48rem 0.65rem",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? "rgba(20, 241, 149, 0.14)" : "transparent",
                    color: isSelected ? "#14f195" : "#e2e8f0",
                    border: isSelected
                      ? "1px solid rgba(20, 241, 149, 0.32)"
                      : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="flex items-center gap-2.5"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}
                  >
                    <span className="text-sm leading-none" style={{ fontSize: "0.95rem" }}>
                      {item.flag}
                    </span>
                    <span className="tracking-tight">{item.nativeName}</span>
                  </span>

                  <span
                    className="flex items-center gap-1.5"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span
                      className="rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-400 border border-slate-800"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.35rem",
                        borderRadius: "0.3rem",
                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                        border: "1px solid rgba(51, 65, 85, 0.6)",
                        color: isSelected ? "#14f195" : "#94a3b8",
                      }}
                    >
                      {item.shortLabel}
                    </span>
                    {isSelected && <CheckIcon />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Minimalist Floating Action Button (FAB) Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change language (current: ${currentLang.nativeName})`}
        title={`Language: ${currentLang.nativeName} (${currentLang.shortLabel})`}
        className="group flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-950/90 px-3.5 py-2 text-xs font-semibold text-slate-100 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-emerald-400/50 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          borderRadius: "9999px",
          border: isOpen
            ? "1px solid rgba(20, 241, 149, 0.55)"
            : "1px solid rgba(39, 39, 42, 0.92)",
          backgroundColor: "rgba(9, 9, 11, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "0.48rem 0.85rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#f8fafc",
          cursor: "pointer",
          boxShadow: "0 10px 28px rgba(0, 0, 0, 0.48), 0 0 14px rgba(20, 241, 149, 0.08)",
        }}
      >
        <GlobeIcon className="text-emerald-400" />
        <span className="text-sm leading-none" style={{ fontSize: "0.9rem" }}>
          {currentLang.flag}
        </span>
        <span
          className="font-mono text-[11px] font-bold tracking-wider text-slate-100"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
          }}
        >
          {currentLang.shortLabel}
        </span>
        <ChevronUpIcon isOpen={isOpen} className="text-slate-400 group-hover:text-slate-200" />
      </button>
    </div>
  );
}
