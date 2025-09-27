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

// --- Zod Schema for Validation ---
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
});

type TokenFormData = z.infer<typeof tokenSchema>;

// --- COMPONENTES AUXILIARES ---

// Tooltip para informações adicionais
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  const showTooltip = () => setShow(true);
  const hideTooltip = () => setShow(false);

  return (
    <div 
        className={styles.tooltipContainer} 
        onMouseEnter={showTooltip} 
        onMouseLeave={hideTooltip}
        onClick={() => setShow(prev => !prev)}
    >
      {children}
      {show && <div className={styles.tooltip}>{text}</div>}
    </div>
  );
};

// Ícone de informação
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.infoIcon}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

// Componente da Barra de Progresso
const ProgressBar = ({ progress }: { progress: number }) => (
    <div className={styles.progressBarContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
    </div>
);


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
    formState: { errors },
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
    },
    mode: 'onChange' // Validação em tempo real
  });

  const watchedFields = watch();

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await fetch('/api/costs');
        if (!response.ok) {
          throw new Error('Falha ao buscar custos');
        }
        const data = await response.json();
        setTotalCost(data.totalCost);
      } catch (error) {
        console.error(error);
        setTotalCost('0.094'); // Fallback em caso de erro
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

      // Simulação de progresso de upload
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);
      
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        clearInterval(interval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error('Falha no upload da imagem.');
        }

        const data = await response.json();
        setValue('imageUrl', data.secure_url, { shouldValidate: true });
      } catch (error) {
        setUploadError("Erro no upload. Tente novamente.");
        setImageFile(null);
        clearInterval(interval);
      } finally {
        setTimeout(() => setIsUploading(false), 500);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'image/*': ['.jpeg', '.png', '.jpg', '.gif']},
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setValue('imageUrl', '', { shouldValidate: true });
  }

  const onSubmit = async (data: TokenFormData) => {
    const tokenData = {
      ...data,
      supply: Number(data.supply),
      tokenStandard: 'spl' as 'spl' | 'token-2022',
    };
    await createToken(tokenData);
  };
  
  const getButtonText = () => {
      if (isCreatingToken) return "Criando...";
      if (isUploading) return "Fazendo upload...";
      if (totalCost) return `Criar Token (~${totalCost} SOL)`;
      return "Carregando Custo...";
  }

  return (
    <div className={styles.formGrid}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        <div className={styles.field}>
          <Label htmlFor="name">Nome do Token</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input id="name" type="text" placeholder="Ex: Meu Token" {...field} />}
          />
          {errors.name && <p className={styles.error}>{errors.name.message}</p>}
        </div>

        <div className={styles.field}>
          <Label htmlFor="symbol">Símbolo</Label>
          <Controller
            name="symbol"
            control={control}
            render={({ field }) => <Input id="symbol" type="text" placeholder="Ex: MEU (máx 10)" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} maxLength={10} />}
          />
          {errors.symbol && <p className={styles.error}>{errors.symbol.message}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="decimals">Decimais</Label>
            <Controller
                name="decimals"
                control={control}
                render={({ field }) => <Input id="decimals" type="number" placeholder="Ex: 9" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} min={0} max={9} />}
            />
            {errors.decimals && <p className={styles.error}>{errors.decimals.message}</p>}
        </div>

        <div className={styles.field}>
            <Label htmlFor="supply">Fornecimento Total</Label>
             <Controller
                name="supply"
                control={control}
                render={({ field }) => <Input id="supply" type="number" placeholder="Ex: 1000000" {...field} />}
            />
            {errors.supply && <p className={styles.error}>{errors.supply.message}</p>}
        </div>
        
        <div className={styles.field}>
            <Label htmlFor="imageUrl">Imagem do Token</Label>
            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${errors.imageUrl ? styles.dropzoneError : ''}`}>
              <input {...getInputProps()} />
              {isUploading ? (
                  <div className={styles.uploadingState}>
                    <div className={styles.spinner}></div>
                    <p>Enviando...</p>
                    <ProgressBar progress={uploadProgress} />
                  </div>
              ) : watchedFields.imageUrl ? (
                <div className={styles.preview}>
                  <img src={watchedFields.imageUrl} alt="Preview" />
                  <button type="button" onClick={removeImage} className={styles.removeButton}>×</button>
                </div>
              ) : (
                <p>Arraste e solte a imagem aqui, ou clique para selecionar</p>
              )}
            </div>
            {uploadError && <p className={styles.error}>{uploadError}</p>}
            {errors.imageUrl && <p className={styles.error}>{errors.imageUrl.message}</p>}
        </div>

        <div className={styles.advancedSection}>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={styles.advancedButton}>
                Configurações Avançadas de Controle
                <span>{showAdvanced ? '▲' : '▼'}</span>
            </button>
            <p className={styles.advancedDescription}>
                Controle se você pode criar mais tokens ou congelar contas de token no futuro.
            </p>
            {showAdvanced && (
                <div className={styles.advancedContent}>
                    <div className={styles.checkboxWrapper}>
                        <Controller
                            name="mintAuthority"
                            control={control}
                            render={({ field }) => <input type="checkbox" id="mintAuthority" checked={field.value} onChange={field.onChange} />}
                        />
                        <Label htmlFor="mintAuthority">Manter autoridade para criar mais tokens</Label>
                        <Tooltip text="Marcado: Você poderá criar mais tokens no futuro. Desmarcado: O fornecimento será fixo.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <Controller
                            name="freezeAuthority"
                            control={control}
                            render={({ field }) => <input type="checkbox" id="freezeAuthority" checked={field.value} onChange={field.onChange} />}
                        />
                        <Label htmlFor="freezeAuthority">Manter autoridade para congelar tokens</Label>
                        <Tooltip text="Marcado: Você poderá congelar tokens em qualquer carteira. Desmarcado: Ninguém poderá ter seus tokens congelados.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                     <div className={styles.checkboxWrapper}>
                        <Controller
                            name="isMetadataMutable"
                            control={control}
                            render={({ field }) => <input type="checkbox" id="isMetadataMutable" checked={field.value} onChange={field.onChange} />}
                        />
                        <Label htmlFor="isMetadataMutable">Metadados mutáveis</Label>
                        <Tooltip text="Marcado: Você poderá alterar o nome, símbolo e imagem do token no futuro. Desmarcado: Os metadados serão permanentes.">
                           <InfoIcon />
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>

        <Button type="submit" disabled={isCreatingToken || isUploading || !totalCost}>
          {getButtonText()}
        </Button>
      </form>

      <div className={styles.previewContainer}>
        <TokenPreview
          name={watchedFields.name}
          symbol={watchedFields.symbol}
          imageUrl={watchedFields.imageUrl}
          supply={watchedFields.supply}
        />
      </div>
    </div>
  );
}

