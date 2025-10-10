"use client";

import React, { useState } from "react";
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

// --- Zod Schema with validation for formatted supply and new fields ---
const tokenSchema = z.object({
  name: z.string().min(1, "Token name is required."),
  symbol: z.string()
    .min(1, "Symbol is required.")
    .max(10, "Symbol cannot exceed 10 characters."),
  description: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  decimals: z.number()
    .min(0, "Decimals must be at least 0.")
    .max(9, "Decimals cannot be greater than 9.")
    .int("Decimals must be an integer."),
  supply: z.string()
    .refine(val => {
        const num = parseFloat(val.replace(/,/g, ''));
        return !isNaN(num) && num > 0;
    }, {
        message: "Supply must be greater than zero.",
    }),
  imageUrl: z.string().min(1, "Image is required.").url("Invalid image URL."),
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

const ProgressBar = ({ progress }: { progress: number }) => <div className={styles.progressBarContainer}><div className={styles.progressBar} style={{ width: `${progress}%` }}></div></div>;

// Function to format numbers with thousand separators
const formatNumber = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '');
    if (cleanedValue === '') return '';
    try {
      const number = BigInt(cleanedValue);
      return number.toLocaleString('en-US');
    } catch (e) {
      return cleanedValue;
    }
};

const STEPS = [
  { id: 1, title: 'Token Details' },
  { id: 2, title: 'Metadata & Media' },
  { id: 3, title: 'Advanced Settings' },
];

export default function TokenForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { createToken, isLoading: isCreatingToken } = useCreateToken();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      name: "",
      symbol: "",
      decimals: 9,
      supply: "",
      imageUrl: "",
      description: "",
      website: "",
      twitter: "",
      instagram: "",
      mintAuthority: true,
      freezeAuthority: false,
      isMetadataMutable: true,
      tokenStandard: 'spl',
      transferFee: { basisPoints: 0, maxFee: 0 },
    },
    mode: 'onChange'
  });

  const watchedFields = watch();
  
  const nextStep = async () => {
    let fieldsToValidate: (keyof TokenFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'symbol', 'decimals', 'supply'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['imageUrl', 'description', 'website', 'twitter', 'instagram'];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };


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
        if (!response.ok) throw new Error('Image upload failed.');
        const data = await response.json();
        setValue('imageUrl', data.secure_url, { shouldValidate: true });
      } catch (error) {
        setUploadError("Upload error. Please try again.");
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
    const tokenDataForApi = {
        ...data,
        supply: Number(String(data.supply).replace(/[^0-9]/g, '')),
        transferFee: {
            basisPoints: data.transferFee?.basisPoints ?? 0,
            maxFee: data.transferFee?.maxFee ?? 0,
        },
    };
    await createToken(tokenDataForApi);
  };
  
  const getButtonText = () => {
      if (isCreatingToken) return "Waiting for confirmation...";
      if (isUploading) return "Uploading image...";
      return `Create Token`;
  }

  return (
    <div className={styles.formGrid}>
       <div className={styles.formWrapper}>
        <div className={styles.stepIndicatorContainer}>
            {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className={`${styles.stepIndicator} ${currentStep >= step.id ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>{currentStep > step.id ? '✓' : step.id}</div>
                        <div className={styles.stepTitle}>{step.title}</div>
                    </div>
                    {index < STEPS.length - 1 && <div className={styles.stepConnector}></div>}
                </React.Fragment>
            ))}
        </div>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        
        {currentStep === 1 && (
          <section className={styles.formSection}>
            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label htmlFor="name">Token Name</Label>
                  <Controller name="name" control={control} render={({ field }) => <Input id="name" placeholder="Ex: My Token" {...field} />} />
                  {errors.name && <p className={styles.error}>{errors.name.message}</p>}
                </div>

                <div className={styles.field}>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Controller name="symbol" control={control} render={({ field }) => <Input id="symbol" placeholder="Ex: MYTK" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} maxLength={10} />} />
                  {errors.symbol && <p className={styles.error}>{errors.symbol.message}</p>}
                </div>
            </div>
            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                    <Label htmlFor="decimals">Decimals</Label>
                    <Controller name="decimals" control={control} render={({ field }) => <Input id="decimals" type="number" placeholder="9" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} min={0} max={9} />} />
                    {errors.decimals && <p className={styles.error}>{errors.decimals.message}</p>}
                </div>

                <div className={styles.field}>
                    <Label htmlFor="supply">Total Supply</Label>
                     <Controller 
                        name="supply" 
                        control={control} 
                        render={({ field }) => (
                            <Input 
                                id="supply" 
                                placeholder="Ex: 1,000,000" 
                                {...field} 
                                onChange={e => {
                                    const formattedValue = formatNumber(e.target.value);
                                    field.onChange(formattedValue);
                                }} 
                            />
                        )} 
                    />
                    {errors.supply && <p className={styles.error}>{errors.supply.message}</p>}
                </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className={styles.formSection}>
            <div className={styles.field}>
                <Label htmlFor="imageUrl">Token Image</Label>
                <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''} ${errors.imageUrl ? styles.dropzoneError : ''}`}>
                  <input {...getInputProps()} />
                  {isUploading ? (
                      <div className={styles.uploadingState}><div className={styles.spinner}></div><p>Uploading...</p><ProgressBar progress={uploadProgress} /></div>
                  ) : watchedFields.imageUrl ? (
                    <div className={styles.preview}><img src={watchedFields.imageUrl} alt="Preview" /><button type="button" onClick={removeImage} className={styles.removeButton}>×</button></div>
                  ) : (
                    <p>Drag & drop, or click to select (PNG, JPG)</p>
                  )}
                </div>
                {uploadError && <p className={styles.error}>{uploadError}</p>}
                {errors.imageUrl && <p className={styles.error}>{errors.imageUrl.message}</p>}
            </div>
            <div className={styles.field}>
                <Label htmlFor="description">Description (Optional)</Label>
                <Controller name="description" control={control} render={({ field }) => <Input id="description" placeholder="A brief description of your token" {...field} />} />
                {errors.description && <p className={styles.error}>{errors.description.message}</p>}
            </div>
            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Controller name="website" control={control} render={({ field }) => <Input id="website" placeholder="https://yourproject.com" {...field} />} />
                </div>
                <div className={styles.field}>
                    <Label htmlFor="twitter">X / Twitter (Optional)</Label>
                    <Controller name="twitter" control={control} render={({ field }) => <Input id="twitter" placeholder="@user" {...field} />} />
                </div>
                 <div className={styles.field}>
                    <Label htmlFor="instagram">Instagram (Optional)</Label>
                    <Controller name="instagram" control={control} render={({ field }) => <Input id="instagram" placeholder="username" {...field} />} />
                </div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className={styles.formSection}>
            <div className={styles.field}>
                <Label>Token Standard</Label>
                <Controller
                    name="tokenStandard"
                    control={control}
                    render={({ field }) => (
                        <div className={styles.segmentedControl}>
                            <button type="button" className={field.value === 'spl' ? styles.active : ''} onClick={() => field.onChange('spl')}>Standard (SPL)</button>
                            <button type="button" className={field.value === 'token-2022' ? styles.active : ''} onClick={() => field.onChange('token-2022')}>Token-2022</button>
                        </div>
                    )}
                />
            </div>
            {watchedFields.tokenStandard === 'token-2022' && (
                <div className={styles.advancedContent}>
                    <div className={styles.field}>
                        <Label htmlFor="transferFeeBasisPoints">Transfer Fee (%)</Label>
                        <Controller name="transferFee.basisPoints" control={control} render={({ field }) => <Input type="number" placeholder="Ex: 100 for 1%" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} min={0} max={10000} />} />
                        <p className={styles.fieldDescription}>Value in basis points. 100 = 1%. Max 10000.</p>
                    </div>
                    <div className={styles.field}>
                        <Label htmlFor="transferFeeMaxFee">Maximum Transfer Fee</Label>
                        <Controller name="transferFee.maxFee" control={control} render={({ field }) => <Input type="number" placeholder="Ex: 5000" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} min={0} />} />
                         <p className={styles.fieldDescription}>The maximum fee that can be charged per transfer, in token units.</p>
                    </div>
                </div>
            )}
            <div className={styles.authoritySection}>
              <h3 className={styles.authorityTitle}>Authority Options</h3>
              <div className={styles.authorityOptionsGrid}>
                <div className={styles.authorityOption}>
                  <div className={styles.authorityText}>
                    <Label htmlFor="mintAuthority">Mint Authority (Create more tokens)</Label>
                    <p>Allows increasing the total supply in the future. Disable for a fixed supply.</p>
                  </div>
                  <Controller 
                    name="mintAuthority" 
                    control={control} 
                    render={({ field }) => (
                      <label className={styles.switch}>
                        <input type="checkbox" id="mintAuthority" checked={field.value} onChange={field.onChange} />
                        <span className={styles.slider}></span>
                      </label>
                    )} 
                  />
                </div>
                <div className={styles.authorityOption}>
                  <div className={styles.authorityText}>
                    <Label htmlFor="isMetadataMutable">Mutable Metadata</Label>
                    <p>Allows editing token name, symbol, and image in the future. Disable for permanent metadata.</p>
                  </div>
                  <Controller 
                    name="isMetadataMutable" 
                    control={control} 
                    render={({ field }) => (
                      <label className={styles.switch}>
                        <input type="checkbox" id="isMetadataMutable" checked={field.value} onChange={field.onChange} />
                        <span className={styles.slider}></span>
                      </label>
                    )} 
                  />
                </div>
                <div className={styles.authorityOption}>
                  <div className={styles.authorityText}>
                    <Label htmlFor="freezeAuthority">Freeze Authority (Freeze tokens)</Label>
                    <p>Allows freezing tokens in any wallet. Usually disabled for decentralization.</p>
                  </div>
                  <Controller 
                    name="freezeAuthority" 
                    control={control} 
                    render={({ field }) => (
                      <label className={styles.switch}>
                        <input type="checkbox" id="freezeAuthority" checked={field.value} onChange={field.onChange} />
                        <span className={styles.slider}></span>
                      </label>
                    )} 
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <div className={styles.navigationButtons}>
            {currentStep > 1 && <Button type="button" className="secondary" onClick={prevStep} disabled={isCreatingToken}>Back</Button>}
            {currentStep < STEPS.length && <Button type="button" onClick={nextStep} disabled={isCreatingToken}>Next</Button>}
            {currentStep === STEPS.length && <Button type="submit" disabled={isCreatingToken || isUploading}>{getButtonText()}</Button>}
        </div>
      </form>
      </div>

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
