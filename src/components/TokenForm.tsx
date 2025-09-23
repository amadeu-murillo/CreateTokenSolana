"use client";

import { useState, useEffect, useCallback } from "react";
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TokenForm.module.css";
import TokenPreview from "./TokenPreview";

interface FormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  imageUrl?: string;
}

export default function TokenForm() {
  const { createToken, isLoading } = useCreateToken();

  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Advanced options state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mintAuthority, setMintAuthority] = useState(false);
  const [freezeAuthority, setFreezeAuthority] = useState(true);

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});

  const validateField = useCallback((name: keyof FormErrors, value: any) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value) error = "O nome do token é obrigatório.";
        break;
      case "symbol":
        if (!value) error = "O símbolo é obrigatório.";
        else if (value.length > 10) error = "O símbolo não pode ter mais de 10 caracteres.";
        break;
      case "decimals":
        if (value === "" || isNaN(value) || value < 0 || value > 9) {
          error = "Decimais devem ser um número entre 0 e 9.";
        }
        break;
      case "supply":
        if (!value || isNaN(value) || Number(value) <= 0) {
          error = "O fornecimento deve ser um número positivo.";
        }
        break;
      case "imageUrl":
        try {
          new URL(value);
        } catch (_) {
          error = "Por favor, insira uma URL válida.";
        }
        if (!value) error = "A URL da imagem é obrigatória.";
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const handleImagePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text) {
        setImageUrl(text);
        validateField('imageUrl', text);
    }
  }
  
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    validateField('imageUrl', url);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger validation for all fields on submit
    validateField('name', name);
    validateField('symbol', symbol);
    validateField('decimals', decimals);
    validateField('supply', supply);
    validateField('imageUrl', imageUrl);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error);
    if (hasErrors || !name || !symbol || supply === "" || !imageUrl) {
        console.log("Formulário inválido", errors);
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
        {/* Fields */}
        <div className={styles.field}>
          <Label htmlFor="name">Nome do Token</Label>
          <Input id="name" type="text" placeholder="Ex: Meu Token" value={name} onChange={(e) => { setName(e.target.value); validateField('name', e.target.value); }} required />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <Label htmlFor="symbol">Símbolo</Label>
          <Input id="symbol" type="text" placeholder="Ex: MEU (máx 10)" value={symbol} onChange={(e) => { setSymbol(e.target.value.toUpperCase()); validateField('symbol', e.target.value); }} maxLength={10} required />
          {errors.symbol && <p className={styles.error}>{errors.symbol}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="decimals">Decimais</Label>
            <Input id="decimals" type="number" placeholder="Ex: 9" value={decimals} onChange={(e) => { setDecimals(Number(e.target.value)); validateField('decimals', e.target.value); }} min={0} max={9} required/>
            {errors.decimals && <p className={styles.error}>{errors.decimals}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="supply">Fornecimento Total</Label>
            <Input id="supply" type="number" placeholder="Ex: 1000000" value={supply} onChange={(e) => { setSupply(e.target.value); validateField('supply', e.target.value); }} required/>
            {errors.supply && <p className={styles.error}>{errors.supply}</p>}
        </div>
        
        <div className={styles.field}>
            <Label htmlFor="imageUrl">URL da Imagem do Token</Label>
            <Input id="imageUrl" type="url" placeholder="https://i.imgur.com/seu-logo.png" value={imageUrl} onPaste={handleImagePaste} onChange={handleImageUrlChange} required/>
            {errors.imageUrl && <p className={styles.error}>{errors.imageUrl}</p>}
        </div>

        {/* Advanced Options */}
        <div className={styles.advancedSection}>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={styles.advancedButton}>
                Opções Avançadas {showAdvanced ? '▲' : '▼'}
            </button>
            {showAdvanced && (
                <div className={styles.advancedContent}>
                    <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="mintAuthority" checked={mintAuthority} onChange={(e) => setMintAuthority(e.target.checked)} />
                        <Label htmlFor="mintAuthority">Manter autoridade para criar mais tokens</Label>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="freezeAuthority" checked={freezeAuthority} onChange={(e) => setFreezeAuthority(e.target.checked)} />
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
