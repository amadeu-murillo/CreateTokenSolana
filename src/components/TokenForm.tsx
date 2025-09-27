"use client";

import React, { useReducer, useState } from "react";
import { useDropzone } from 'react-dropzone';
import { useCreateToken } from "../hooks/useCreateToken";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import styles from "./TokenForm.module.css";
import TokenPreview from "./TokenPreview";

// --- COMPONENTES AUXILIARES ---
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

// --- LÓGICA DO FORMULÁRIO ---
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
  isMetadataMutable: boolean;
  tokenStandard: 'spl' | 'token-2022';
  transferFeeBasisPoints: string;
  transferFeeMaxFee: string;
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
  isMetadataMutable: true,
  tokenStandard: 'spl',
  transferFeeBasisPoints: '',
  transferFeeMaxFee: '',
  errors: {},
};

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: undefined } };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

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
        newErrors.imageUrl = "A imagem é obrigatória.";
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
  const { createToken, isLoading: isCreatingToken } = useCreateToken();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { name, symbol, decimals, supply, imageUrl, showAdvanced, mintAuthority, freezeAuthority, isMetadataMutable, tokenStandard, transferFeeBasisPoints, transferFeeMaxFee, errors } = state;
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const handleFieldChange = (field: keyof Omit<State, 'errors'>, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setUploadError(null);
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Falha no upload da imagem.');
        }

        const data = await response.json();
        handleFieldChange('imageUrl', data.secure_url);
      } catch (error) {
        setUploadError("Erro no upload. Tente novamente.");
        setImageFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': ['.jpeg', '.png', '.jpg', '.gif']},
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const removeImage = () => {
    setImageFile(null);
    handleFieldChange('imageUrl', '');
  }

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
        <div className={styles.field}>
          <Label>Padrão do Token</Label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" value="spl" checked={tokenStandard === 'spl'} onChange={() => handleFieldChange('tokenStandard', 'spl')} />
              <span>SPL Padrão</span>
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" value="token-2022" checked={tokenStandard === 'token-2022'} onChange={() => handleFieldChange('tokenStandard', 'token-2022')} />
              <span>Token-2022 (Avançado)</span>
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
            <Label htmlFor="imageUrl">Imagem do Token</Label>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
              <input {...getInputProps()} />
              {imageFile ? (
                <div className={styles.preview}>
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                  {isUploading && <div className={styles.spinner}></div>}
                  <button type="button" onClick={removeImage} className={styles.removeButton}>×</button>
                </div>
              ) : (
                <p>Arraste e solte a imagem aqui, ou clique para selecionar</p>
              )}
            </div>
            {uploadError && <p className={styles.error}>{uploadError}</p>}
            {errors.imageUrl && <p className={styles.error}>{errors.imageUrl}</p>}
        </div>

        {tokenStandard === 'token-2022' && (
          <div className={styles.advancedContent}>
            <div className={styles.field}>
              <Label htmlFor="transferFee">Taxa de Transferência (opcional)</Label>
              <div className={styles.feeInputs}>
                <Input id="transferFee" type="number" placeholder="Taxa em % (Ex: 1 para 1%)" value={transferFeeBasisPoints} onChange={(e) => handleFieldChange('transferFeeBasisPoints', (Number(e.target.value) * 100).toString())} min="0" max="100" step="0.01" />
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

        <Button type="submit" disabled={isCreatingToken || isUploading}>
          {isCreatingToken ? "Criando..." : isUploading ? "Fazendo upload..." : "Criar Token (~0.094 SOL)"}
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