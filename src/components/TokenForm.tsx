"use client";

import React, { useReducer, useState, useRef } from "react";
import { useCreateToken } from "../hooks/useCreateToken";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import styles from "./TokenForm.module.css";
import TokenPreview from "./TokenPreview";

// --- COMPONENTE TOOLTIP ---
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.tooltipContainer} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className={styles.tooltip}>{text}</div>}
    </div>
  );
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.infoIcon}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);
// --- FIM DO COMPONENTE TOOLTIP ---


interface FormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  imageUrl?: string;
  transferFeeBasisPoints?: string;
  transferFeeMaxFee?: string;
}

interface State {
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  imageUrl: string;
  showAdvanced: boolean;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  isMetadataMutable: boolean; // MODIFICAÇÃO: Adicionado
  tokenStandard: 'spl' | 'token-2022'; // MODIFICAÇÃO: Adicionado
  transferFeeBasisPoints: string; // MODIFICAÇÃO: Adicionado
  transferFeeMaxFee: string; // MODIFICAÇÃO: Adicionado
  errors: FormErrors;
}

type Action =
  | { type: 'SET_FIELD'; field: keyof Omit<State, 'errors'>; value: any }
  | { type: 'SET_ERRORS'; errors: FormErrors };

const initialState: State = {
  name: "",
  symbol: "",
  decimals: 9,
  supply: "",
  imageUrl: "",
  showAdvanced: false,
  mintAuthority: false,
  freezeAuthority: true,
  isMetadataMutable: true, // MODIFICAÇÃO: Valor padrão
  tokenStandard: 'spl', // MODIFICAÇÃO: Valor padrão
  transferFeeBasisPoints: '', // MODIFICAÇÃO: Valor padrão
  transferFeeMaxFee: '', // MODIFICAÇÃO: Valor padrão
  errors: {},
};

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

// MODIFICAÇÃO: Validação atualizada para os novos campos
const validateForm = (state: Omit<State, 'errors' | 'showAdvanced'>): FormErrors => {
    const newErrors: FormErrors = {};
    if (!state.name) newErrors.name = "O nome do token é obrigatório.";
    if (!state.symbol) newErrors.symbol = "O símbolo é obrigatório.";
    else if (state.symbol.length > 10) newErrors.symbol = "O símbolo não pode ter mais de 10 caracteres.";
    if (state.decimals === undefined || isNaN(state.decimals) || state.decimals < 0 || state.decimals > 9) {
      newErrors.decimals = "Decimais devem ser um número entre 0 e 9.";
    }
    if (!state.supply || isNaN(Number(state.supply)) || Number(state.supply) <= 0) {
      newErrors.supply = "O fornecimento deve ser um número positivo.";
    }
    if (!state.imageUrl) {
        newErrors.imageUrl = "A URL da imagem é obrigatória.";
    } else {
        try {
            new URL(state.imageUrl);
        } catch (_) {
            newErrors.imageUrl = "Por favor, insira uma URL válida.";
        }
    }
    if (state.tokenStandard === 'token-2022') {
        const basisPoints = Number(state.transferFeeBasisPoints);
        if (state.transferFeeBasisPoints && (isNaN(basisPoints) || basisPoints < 0 || basisPoints > 10000)) {
            newErrors.transferFeeBasisPoints = "A taxa deve ser entre 0 e 10000 (100%).";
        }
        const maxFee = Number(state.transferFeeMaxFee);
        if (state.transferFeeMaxFee && (isNaN(maxFee) || maxFee < 0)) {
            newErrors.transferFeeMaxFee = "A taxa máxima deve ser um número positivo.";
        }
    }
    return newErrors;
};


export default function TokenForm() {
  const { createToken, isLoading } = useCreateToken();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { name, symbol, decimals, supply, imageUrl, showAdvanced, mintAuthority, freezeAuthority, isMetadataMutable, tokenStandard, transferFeeBasisPoints, transferFeeMaxFee, errors } = state;
  
  const handleFieldChange = (field: keyof Omit<State, 'errors'>, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
    const newErrors = validateForm({ ...state, [field]: value });
    dispatch({ type: 'SET_ERRORS', errors: { ...errors, [field]: newErrors[field as keyof FormErrors] } });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(state);
    if (Object.keys(validationErrors).length > 0) {
        dispatch({ type: 'SET_ERRORS', errors: validationErrors });
        return;
    }
    const tokenData = {
      name,
      symbol,
      decimals,
      supply: Number(supply),
      imageUrl,
      mintAuthority,
      freezeAuthority,
      tokenStandard,
      isMetadataMutable,
      transferFee: {
          basisPoints: Number(transferFeeBasisPoints) || 0,
          maxFee: Number(transferFeeMaxFee) * Math.pow(10, decimals) || 0,
      },
    };
    await createToken(tokenData);
  };

  return (
    <div className={styles.formGrid}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* MODIFICAÇÃO: Seletor de Padrão de Token */}
        <div className={styles.field}>
          <Label>Padrão do Token</Label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" value="spl" checked={tokenStandard === 'spl'} onChange={() => handleFieldChange('tokenStandard', 'spl')} />
              <span>SPL Padrão</span>
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" value="token-2022" checked={tokenStandard === 'token-2022'} onChange={() => handleFieldChange('tokenStandard', 'token-2022')} />
              <span>Token-2022 (com Extensões)</span>
            </label>
          </div>
        </div>
        
        <div className={styles.field}>
          <Label htmlFor="name">Nome do Token</Label>
          <Input id="name" type="text" placeholder="Ex: Meu Token" value={name} onChange={(e) => handleFieldChange('name', e.target.value)} required />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <Label htmlFor="symbol">Símbolo</Label>
          <Input id="symbol" type="text" placeholder="Ex: MEU (máx 10)" value={symbol} onChange={(e) => handleFieldChange('symbol', e.target.value.toUpperCase())} maxLength={10} required />
          {errors.symbol && <p className={styles.error}>{errors.symbol}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="decimals">Decimais</Label>
            <Input id="decimals" type="number" placeholder="Ex: 9" value={decimals} onChange={(e) => handleFieldChange('decimals', e.target.value === '' ? '' : Number(e.target.value))} min={0} max={9} required/>
            {errors.decimals && <p className={styles.error}>{errors.decimals}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="supply">Fornecimento Total</Label>
            <Input id="supply" type="number" placeholder="Ex: 1000000" value={supply} onChange={(e) => handleFieldChange('supply', e.target.value)} required/>
            {errors.supply && <p className={styles.error}>{errors.supply}</p>}
        </div>
        
        <div className={styles.field}>
            <Label htmlFor="imageUrl">URL da Imagem do Token</Label>
            <Input id="imageUrl" type="url" placeholder="https://i.imgur.com/seu-logo.png" value={imageUrl} onChange={(e) => handleFieldChange('imageUrl', e.target.value)} onPaste={(e) => handleFieldChange('imageUrl', e.clipboardData.getData('text'))} required/>
            {errors.imageUrl && <p className={styles.error}>{errors.imageUrl}</p>}
        </div>

        {/* MODIFICAÇÃO: Seção para extensões do Token-2022 */}
        {tokenStandard === 'token-2022' && (
          <div className={styles.advancedContent}>
            <div className={styles.field}>
              <Label htmlFor="transferFee">Taxa de Transferência (opcional)</Label>
              <div className={styles.feeInputs}>
                <Input id="transferFee" type="number" placeholder="Taxa % (Ex: 1 para 1%)" value={transferFeeBasisPoints} onChange={(e) => handleFieldChange('transferFeeBasisPoints', e.target.value)} min="0" max="10000" />
                <Input type="number" placeholder="Taxa Máxima (em tokens)" value={transferFeeMaxFee} onChange={(e) => handleFieldChange('transferFeeMaxFee', e.target.value)} min="0" />
              </div>
              {errors.transferFeeBasisPoints && <p className={styles.error}>{errors.transferFeeBasisPoints}</p>}
              {errors.transferFeeMaxFee && <p className={styles.error}>{errors.transferFeeMaxFee}</p>}
            </div>
          </div>
        )}

        <div className={styles.advancedSection}>
            <button type="button" onClick={() => handleFieldChange('showAdvanced', !showAdvanced)} className={styles.advancedButton}>
                Opções de Autoridade {showAdvanced ? '▲' : '▼'}
            </button>
            {showAdvanced && (
                <div className={styles.advancedContent}>
                    <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="mintAuthority" checked={mintAuthority} onChange={(e) => handleFieldChange('mintAuthority', e.target.checked)} />
                        <Label htmlFor="mintAuthority">Manter autoridade para criar mais tokens</Label>
                        <Tooltip text="Marcado: Você poderá criar mais tokens no futuro. Desmarcado: O fornecimento será fixo.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="freezeAuthority" checked={freezeAuthority} onChange={(e) => handleFieldChange('freezeAuthority', e.target.checked)} />
                        <Label htmlFor="freezeAuthority">Manter autoridade para congelar tokens</Label>
                        <Tooltip text="Marcado: Você poderá congelar tokens em qualquer carteira. Desmarcado: Ninguém poderá ter seus tokens congelados.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="isMetadataMutable" checked={isMetadataMutable} onChange={(e) => handleFieldChange('isMetadataMutable', e.target.checked)} />
                        <Label htmlFor="isMetadataMutable">Metadados mutáveis</Label>
                        <Tooltip text="Marcado: Você poderá alterar o nome, símbolo e imagem do token no futuro. Desmarcado: Os metadados serão permanentes.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Criando..." : "Criar Token (~0.094 SOL)"}
        </Button>
      </form>

      <div className={styles.previewContainer}>
        <TokenPreview
          name={name}
          symbol={symbol}
          imageUrl={imageUrl}
          supply={supply}
        />
      </div>
    </div>
  );
}
