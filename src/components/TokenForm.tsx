"use client";

import { useReducer, useCallback } from "react";
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TokenForm.module.css";
import TokenPreview from "./TokenPreview";

// Melhoria: Centralização do estado do formulário com useReducer
interface FormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  imageUrl?: string;
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

// Função de validação fora do componente para ser pura
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
    return newErrors;
};


export default function TokenForm() {
  const { createToken, isLoading } = useCreateToken();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { name, symbol, decimals, supply, imageUrl, showAdvanced, mintAuthority, freezeAuthority, errors } = state;
  
  const handleFieldChange = (field: keyof Omit<State, 'errors'>, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
    // Valida o campo em tempo real após a mudança
    const newErrors = validateForm({ ...state, [field]: value });
    dispatch({ type: 'SET_ERRORS', errors: { ...errors, [field]: newErrors[field as keyof FormErrors] } });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(state);
    if (Object.keys(validationErrors).length > 0) {
        dispatch({ type: 'SET_ERRORS', errors: validationErrors });
        console.log("Formulário inválido", validationErrors);
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
    };

    await createToken(tokenData);
  };

  return (
    <div className={styles.formGrid}>
      <form onSubmit={handleSubmit} className={styles.form}>
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

        <div className={styles.advancedSection}>
            <button type="button" onClick={() => handleFieldChange('showAdvanced', !showAdvanced)} className={styles.advancedButton}>
                Opções Avançadas {showAdvanced ? '▲' : '▼'}
            </button>
            {showAdvanced && (
                <div className={styles.advancedContent}>
                    <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="mintAuthority" checked={mintAuthority} onChange={(e) => handleFieldChange('mintAuthority', e.target.checked)} />
                        <Label htmlFor="mintAuthority">Manter autoridade para criar mais tokens</Label>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="freezeAuthority" checked={freezeAuthority} onChange={(e) => handleFieldChange('freezeAuthority', e.target.checked)} />
                        <Label htmlFor="freezeAuthority">Manter autoridade para congelar tokens</Label>
                    </div>
                </div>
            )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Criando..." : "Criar Token"}
        </Button>
      </form>

      <div className={styles.previewContainer}>
        <TokenPreview name={name} symbol={symbol} imageUrl={imageUrl} supply={supply} />
      </div>
    </div>
  );
}
