"use client";

import React, { useReducer, useState } from "react";
import { useDropzone } from 'react-dropzone';
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TokenForm.module.css";
import TokenPreview from "@/components/TokenPreview";

// --- COMPONENTES AUXILIARES ---

// Tooltip para informações adicionais
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.tooltipContainer} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && <div className={styles.tooltip}>{text}</div>}
    </div>
  );
};

// Ícone de informação
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.infoIcon}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

// --- LÓGICA DO FORMULÁRIO ---

// Tipagem para os erros do formulário
interface FormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  imageUrl?: string;
}

// Tipagem para o estado do formulário
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
  errors: FormErrors;
}

// Tipagem para as ações do reducer
type Action =
  | { type: 'SET_FIELD'; field: keyof Omit<State, 'errors'>; value: any }
  | { type: 'SET_ERRORS'; errors: FormErrors };

// Estado inicial do formulário
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
  errors: {},
};

// Reducer para gerenciar o estado do formulário
function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      // Limpa o erro do campo ao ser modificado
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: undefined } };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    default:
      return state;
  }
}

// Função de validação do formulário
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
    return newErrors;
};


export default function TokenForm() {
  const { createToken, isLoading: isCreatingToken } = useCreateToken();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { name, symbol, decimals, supply, imageUrl, showAdvanced, mintAuthority, freezeAuthority, isMetadataMutable, errors } = state;
  
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
      isMetadataMutable,
      tokenStandard: 'spl', // Fixo para SPL Padrão
    };
    await createToken(tokenData);
  };

  return (
    <div className={styles.formGrid}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Campo de Padrão do Token removido para simplificar */}
        
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
              {imageUrl ? (
                <div className={styles.preview}>
                  <img src={imageUrl} alt="Preview" />
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

        {/* Seção de Opções Avançadas removida para focar no SPL Padrão */}

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
          {isCreatingToken ? "Criando..." : isUploading ? "Fazendo upload..." : "Criar Token"}
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

