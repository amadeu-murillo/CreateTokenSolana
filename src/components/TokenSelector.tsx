// src/components/TokenSelector.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './TokenSelector.module.css';
import { Input } from './ui/input';

interface UserToken {
    mint: string;
    amount: string;
    decimals: number;
    name?: string;
    symbol?: string;
    logoURI?: string;
}

interface TokenSelectorProps {
    tokens: UserToken[];
    selectedTokenMint: string;
    onSelectToken: (mint: string) => void;
    isLoading: boolean;
    disabled: boolean;
}

export const TokenSelector = ({ tokens, selectedTokenMint, onSelectToken, isLoading, disabled }: TokenSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedToken = tokens.find(t => t.mint === selectedTokenMint);

    const filteredTokens = tokens.filter(token =>
        token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.mint.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (mint: string) => {
        onSelectToken(mint);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            {/* O botão volta para o estilo mais simples */}
            <button className={styles.selectorButton} onClick={() => setIsOpen(!isOpen)} disabled={disabled || isLoading}>
                {isLoading ? (
                    <span>Loading Tokens...</span>
                ) : selectedToken ? (
                    <div className={styles.tokenDisplay}>
                        <Image src={selectedToken.logoURI || '/favicon.ico'} alt={selectedToken.name || 'token'} width={24} height={24} className={styles.tokenIcon} />
                        <span>{selectedToken.symbol || 'TOKEN'}</span>
                    </div>
                ) : (
                    <span>Select a Token in your wallet</span>
                )}
                <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
            </button>

            {/* A lista suspensa continua com o estilo aprimorado (fundo branco, etc) */}
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchWrapper}>
                        <Input
                            type="text"
                            placeholder="Buscar por nome ou símbolo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className={styles.tokenList}>
                        {filteredTokens.length > 0 ? filteredTokens.map(token => (
                            <li
                                key={token.mint}
                                className={`${styles.tokenItem} ${token.mint === selectedTokenMint ? styles.tokenItemSelected : ''}`}
                                onClick={() => handleSelect(token.mint)}
                            >
                                <Image src={token.logoURI || '/favicon.ico'} alt={token.name || 'token'} width={32} height={32} className={styles.tokenIcon} />
                                <div className={styles.tokenItemInfo}>
                                    <span className={styles.tokenSymbol}>{token.symbol || 'Desconhecido'}</span>
                                    <span className={styles.tokenName}>{token.name || token.mint.slice(0, 15) + '...'}</span>
                                </div>
                                <span className={styles.tokenBalance}>{parseFloat(token.amount).toFixed(4)}</span>
                            </li>
                        )) : (
                            <li className={styles.noResult}>No tokens found.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

