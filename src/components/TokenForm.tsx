"use client";

import React, { useState, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TokenForm.module.css";
import TokenPreview from "@/components/TokenPreview";

// --- Zod Schema com Token Standard e Transfer Fee ---
const tokenSchema = z.object({
  name: z.string().min(1, "O nome do token é obrigatório."),
  symbol: z.string()
    .min(1, "O símbolo é obrigatório.")
    .max(10, "O símbolo não pode ter mais de 10 caracteres."),
  decimals: z.number()
    .min(0, "O número de decimais deve ser no mínimo 0.")
    .max(9, "O número de decimais não pode ser maior que 9.")
    .int("O número de decimais deve ser um número inteiro."),
  supply: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "O fornecimento deve ser maior que zero.",
    }),
  imageUrl: z.string().min(1, "A imagem é obrigatória.").url("URL da imagem inválida."),
  mintAuthority: z.boolean(),
  freezeAuthority: z.boolean(),
  isMetadataMutable: z.boolean(),
  tokenStandard: z.enum(['spl', 'token-2022']),
  transferFee: z.object({
    basisPoints: z.number().min(0).max(10000).optional(),
    maxFee: z.number().min(0).optional(),
  }).optional(),
});

type TokenFormData = z.infer<typeof tokenSchema>;

// --- Componentes Auxiliares ---
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <div 
            className={styles.tooltipContainer}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(prev => !prev)}
        >
            {children}
            {showTooltip && <div className={styles.tooltip}>{text}</div>}
        </div>
    );
};
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.infoIcon}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const ProgressBar = ({ progress }: { progress: number }) => <div className={styles.progressBarContainer}><div className={styles.progressBar} style={{ width: `${progress}%` }}></div></div>;


export default function TokenForm() {
  const { createToken, isLoading: isCreatingToken } = useCreateToken();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 9,
      supply: "",
      imageUrl: "",
      mintAuthority: false,
      freezeAuthority: true,
      isMetadataMutable: true,
      tokenStandard: 'spl',
      transferFee: { basisPoints: 0, maxFee: 0 },
    },
    mode: 'onChange'
  });

  const watchedFields = watch();

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await fetch('/api/costs');
        const data = await response.json();
        setTotalCost(parseFloat(data.totalCost).toFixed(3));
      } catch (error) {
        console.error(error);
        setTotalCost('0.094'); // Fallback
      }
    };
    fetchCosts();
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setUploadError(null);
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);

      const interval = setInterval(() => setUploadProgress(prev => Math.min(prev + 10, 90)), 200);
      
      try {
        const response = await fetch('/api/upload-image', { method: 'POST', body: formData });
        clearInterval(interval);
        setUploadProgress(100);
        if (!response.ok) throw new Error('Falha no upload da imagem.');
        const data = await response.json();
        setValue('imageUrl', data.secure_url, { shouldValidate: true });
      } catch (error) {
        setUploadError("Erro no upload. Tente novamente.");
        setImageFile(null);
      } finally {
        setTimeout(() => setIsUploading(false), 500);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': ['.jpeg', '.png', '.jpg', '.gif']},
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setValue('imageUrl', '', { shouldValidate: true });
  }

  const onSubmit = async (data: TokenFormData) => {
    // CORREÇÃO: Transforma os dados do formulário para garantir a compatibilidade de tipos.
    const tokenDataForApi = {
        ...data,
        // Garante que o supply seja um número, removendo qualquer formatação.
        supply: Number(String(data.supply).replace(/[^0-9]/g, '')),
        // Garante que o objeto transferFee e suas propriedades tenham valores padrão.
        transferFee: {
            basisPoints: data.transferFee?.basisPoints ?? 0,
            maxFee: data.transferFee?.maxFee ?? 0,
        },
    };
    await createToken(tokenDataForApi);
  };
  
  const getButtonText = () => {
      if (isCreatingToken) return "Aguardando confirmação...";
      if (isUploading) return "Fazendo upload...";
      if (totalCost) return `Criar Token (~${totalCost} SOL)`;
      return "Carregando Custo...";
  }

  return (
    <div className={styles.formGrid}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        {/* --- Campos Principais --- */}
        <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <Label htmlFor="name">Nome do Token</Label>
              <Controller name="name" control={control} render={({ field }) => <Input id="name" placeholder="Ex: Meu Token" {...field} />} />
              {errors.name && <p className={styles.error}>{errors.name.message}</p>}
            </div>

            <div className={styles.field}>
              <Label htmlFor="symbol">Símbolo</Label>
              <Controller name="symbol" control={control} render={({ field }) => <Input id="symbol" placeholder="Ex: MEU" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} maxLength={10} />} />
              {errors.symbol && <p className={styles.error}>{errors.symbol.message}</p>}
            </div>
        </div>

        <div className={styles.fieldGrid}>
            <div className={styles.field}>
                <Label htmlFor="decimals">Decimais</Label>
                <Controller name="decimals" control={control} render={({ field }) => <Input id="decimals" type="number" placeholder="9" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} min={0} max={9} />} />
                {errors.decimals && <p className={styles.error}>{errors.decimals.message}</p>}
            </div>

            <div className={styles.field}>
                <Label htmlFor="supply">Fornecimento Total</Label>
                 <Controller name="supply" control={control} render={({ field }) => <Input id="supply" placeholder="Ex: 1.000.000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} />} />
                {errors.supply && <p className={styles.error}>{errors.supply.message}</p>}
            </div>
        </div>
        
        <div className={styles.field}>
            <Label htmlFor="imageUrl">Imagem do Token</Label>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${errors.imageUrl ? styles.dropzoneError : ''}`}>
              <input {...getInputProps()} />
              {isUploading ? (
                  <div className={styles.uploadingState}><div className={styles.spinner}></div><p>Enviando...</p><ProgressBar progress={uploadProgress} /></div>
              ) : watchedFields.imageUrl ? (
                <div className={styles.preview}><img src={watchedFields.imageUrl} alt="Preview" /><button type="button" onClick={removeImage} className={styles.removeButton}>×</button></div>
              ) : (
                <p>Arraste e solte, ou clique para selecionar (PNG, JPG)</p>
              )}
            </div>
            {uploadError && <p className={styles.error}>{uploadError}</p>}
            {errors.imageUrl && <p className={styles.error}>{errors.imageUrl.message}</p>}
        </div>
        
        {/* --- Seletor de Padrão de Token --- */}
        <div className={styles.field}>
            <Label>Padrão do Token</Label>
            <Controller
                name="tokenStandard"
                control={control}
                render={({ field }) => (
                    <div className={styles.segmentedControl}>
                        <button type="button" className={field.value === 'spl' ? styles.active : ''} onClick={() => field.onChange('spl')}>Padrão (SPL)</button>
                        <button type="button" className={field.value === 'token-2022' ? styles.active : ''} onClick={() => field.onChange('token-2022')}>Token-2022</button>
                    </div>
                )}
            />
        </div>

        {/* --- Seção Condicional para Token-2022 --- */}
        {watchedFields.tokenStandard === 'token-2022' && (
            <div className={styles.advancedContent}>
                <div className={styles.field}>
                    <Label htmlFor="transferFeeBasisPoints">Taxa de Transferência (%)</Label>
                    <Controller name="transferFee.basisPoints" control={control} render={({ field }) => <Input type="number" placeholder="Ex: 100 para 1%" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} min={0} max={10000} />} />
                    <p className={styles.fieldDescription}>Valor em basis points. 100 = 1%. Máximo de 10000.</p>
                </div>
                <div className={styles.field}>
                    <Label htmlFor="transferFeeMaxFee">Taxa Máxima de Transferência</Label>
                    <Controller name="transferFee.maxFee" control={control} render={({ field }) => <Input type="number" placeholder="Ex: 5000" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} min={0} />} />
                     <p className={styles.fieldDescription}>A taxa máxima que pode ser cobrada por uma transferência, na unidade do token.</p>
                </div>
            </div>
        )}
        
        {/* --- Opções Avançadas --- */}
        <div className={styles.advancedSection}>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={styles.advancedButton}>
                Opções de Autoridade
                <span>{showAdvanced ? '−' : '+'}</span>
            </button>
            {showAdvanced && (
                <div className={styles.advancedContent}>
                    <div className={styles.checkboxWrapper}>
                        <Controller name="mintAuthority" control={control} render={({ field }) => <input type="checkbox" id="mintAuthority" checked={field.value} onChange={field.onChange} />} />
                        <Label htmlFor="mintAuthority">Manter autoridade para criar mais tokens</Label>
                        <Tooltip text="Marcado: Você poderá criar mais tokens no futuro. Desmarcado: O fornecimento será fixo e imutável."><InfoIcon /></Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <Controller name="freezeAuthority" control={control} render={({ field }) => <input type="checkbox" id="freezeAuthority" checked={field.value} onChange={field.onChange} />} />
                        <Label htmlFor="freezeAuthority">Manter autoridade para congelar tokens</Label>
                        <Tooltip text="Marcado: Você poderá congelar tokens em qualquer carteira. Desmarcado: Ninguém poderá ter seus tokens congelados."><InfoIcon /></Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <Controller name="isMetadataMutable" control={control} render={({ field }) => <input type="checkbox" id="isMetadataMutable" checked={field.value} onChange={field.onChange} />} />
                        <Label htmlFor="isMetadataMutable">Metadados mutáveis</Label>
                        <Tooltip text="Marcado: Você poderá alterar o nome, símbolo e imagem do token no futuro. Desmarcado: Os metadados serão permanentes."><InfoIcon /></Tooltip>
                    </div>
                </div>
            )}
        </div>

        <Button type="submit" disabled={isCreatingToken || isUploading || !totalCost || !isValid}>
          {getButtonText()}
        </Button>
      </form>

      <div className={styles.previewContainer}>
        <TokenPreview
          name={watchedFields.name}
          symbol={watchedFields.symbol}
          imageUrl={watchedFields.imageUrl}
          supply={watchedFields.supply}
          tokenStandard={watchedFields.tokenStandard}
        />
      </div>
    </div>
  );
}

