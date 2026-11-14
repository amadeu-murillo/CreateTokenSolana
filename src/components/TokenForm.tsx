"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateToken } from "@/hooks/useCreateToken";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import { useCluster } from "@/context/WalletContext";
import {
  MODULAR_FEE_BASE_CREATE_SOL,
  MODULAR_FEE_REVOKE_FREEZE_SOL,
  MODULAR_FEE_REVOKE_MINT_SOL,
  MODULAR_FEE_IMMUTABLE_METADATA_SOL,
  MODULAR_FEE_CUSTOM_CREATOR_SOL,
  MODULAR_FEE_TRANSFER_FEE_EXT_SOL,
  calculateModularTokenCreationFee,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Notification from "@/components/ui/Notification";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import styles from "@/components/TokenForm.module.css";
import TokenPreview from "@/components/TokenPreview";

const tokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Token name is required.")
    .max(32, "Token name cannot exceed 32 characters."),
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required.")
    .max(10, "Symbol cannot exceed 10 characters."),
  description: z.string().max(500).optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  decimals: z
    .number()
    .min(0, "Decimals must be at least 0.")
    .max(9, "Decimals cannot be greater than 9.")
    .int("Decimals must be an integer."),
  supply: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/,/g, ""));
      return !isNaN(num) && num > 0;
    },
    {
      message: "Supply must be greater than zero.",
    }
  ),
  imageUrl: z.string().min(1, "Token logo image is required.").url("Invalid image URL."),
  storageProvider: z.enum(["arweave", "cloudinary"]),
  mintAuthority: z.boolean(),
  freezeAuthority: z.boolean(),
  isMetadataMutable: z.boolean(),
  tokenStandard: z.enum(["spl", "token-2022"]),
  useNativeMetadataExtension: z.boolean(),
  customCreator: z.object({
    enabled: z.boolean(),
    name: z.string().max(64).optional(),
    website: z.string().max(200).optional(),
  }),
  transferFee: z
    .object({
      basisPoints: z.number().min(0).max(10000).optional(),
      maxFee: z.number().min(0).optional(),
    })
    .optional(),
});

type TokenFormData = z.infer<typeof tokenSchema>;

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className={styles.progressBarContainer}>
    <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
  </div>
);

const formatNumber = (value: string) => {
  const cleanedValue = value.replace(/\D/g, "");
  if (cleanedValue === "") return "";
  try {
    const number = BigInt(cleanedValue);
    return number.toLocaleString("en-US");
  } catch {
    return cleanedValue;
  }
};

const STEPS = [
  { id: 1, title: "1. Token Identity" },
  { id: 2, title: "2. Logo & Socials" },
  { id: 3, title: "3. Security & Mint" },
];

export default function TokenForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { cluster, setCluster } = useCluster();
  const {
    createToken,
    isLoading: isCreatingToken,
    statusStep,
    progressStep,
    error: createError,
    clearError,
  } = useCreateToken();
  const {
    uploadImageDecentralized,
    isUploading,
    uploadProgress,
    uploadError,
    setUploadError,
  } = useArweaveUpload();

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
      supply: "1,000,000,000",
      imageUrl: "",
      storageProvider: "arweave",
      description: "",
      website: "",
      twitter: "",
      instagram: "",
      // Phase 1: Revoke Freeze (+0.10), Revoke Mint (+0.10), and Immutable Metadata (+0.05) ON by default!
      mintAuthority: false,
      freezeAuthority: false,
      isMetadataMutable: false,
      tokenStandard: "spl",
      useNativeMetadataExtension: false,
      customCreator: {
        enabled: false,
        name: "",
        website: "",
      },
      transferFee: { basisPoints: 0, maxFee: 0 },
    },
    mode: "onChange",
  });

  const watchedFields = watch();

  const modularOptions = useMemo(
    () => ({
      revokeFreeze: !watchedFields.freezeAuthority,
      revokeMint: !watchedFields.mintAuthority,
      immutableMetadata: !watchedFields.isMetadataMutable,
      customCreatorInfo: Boolean(watchedFields.customCreator?.enabled),
      hasTransferFeeExtension:
        watchedFields.tokenStandard === "token-2022" &&
        Boolean((watchedFields.transferFee?.basisPoints ?? 0) > 0),
    }),
    [
      watchedFields.freezeAuthority,
      watchedFields.mintAuthority,
      watchedFields.isMetadataMutable,
      watchedFields.customCreator?.enabled,
      watchedFields.tokenStandard,
      watchedFields.transferFee?.basisPoints,
    ]
  );

  const { totalSol: liveModularTotalSol } = useMemo(
    () => calculateModularTokenCreationFee(modularOptions),
    [modularOptions]
  );

  // Broadcast live modular selections to CostSummary in the sidebar
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("modular-fee-update", { detail: modularOptions })
      );
    }
  }, [modularOptions]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof TokenFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "symbol", "decimals", "supply"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["imageUrl", "description", "website", "twitter", "instagram"];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = async (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    if (targetStep === currentStep + 1) {
      await nextStep();
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const uploadedUri = await uploadImageDecentralized(
        file,
        watchedFields.storageProvider === "arweave" ? "wallet-irys" : "server-irys"
      );
      if (uploadedUri) {
        setValue("imageUrl", uploadedUri, { shouldValidate: true });
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg", ".gif", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadError(null);
    setValue("imageUrl", "", { shouldValidate: true });
  };

  const onSubmit = async (data: TokenFormData) => {
    const tokenDataForApi = {
      ...data,
      supply: Number(String(data.supply).replace(/[^0-9]/g, "")),
      customCreator: {
        enabled: Boolean(data.customCreator?.enabled),
        name: data.customCreator?.name || "",
        website: data.customCreator?.website || "",
      },
      transferFee: {
        basisPoints: data.transferFee?.basisPoints ?? 0,
        maxFee: data.transferFee?.maxFee ?? 0,
      },
    };
    await createToken(tokenDataForApi);
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formWrapper}>
        {/* Top Network & Live Modular Fee Bar Inside Form Card */}
        <div className={styles.formTopBar}>
          <div className={styles.networkInlineGroup}>
            <span className={styles.networkLabel}>Target Network:</span>
            <div className={styles.networkSegment}>
              <button
                type="button"
                onClick={() => setCluster("mainnet-beta")}
                className={cluster === "mainnet-beta" ? styles.networkSegmentActive : ""}
              >
                <span className={styles.dotMainnet} />
                Mainnet-Beta (Default)
              </button>
              <button
                type="button"
                onClick={() => setCluster("devnet")}
                className={cluster === "devnet" ? styles.networkSegmentDevnet : ""}
              >
                <span className={styles.dotDevnet} />
                Devnet (Test)
              </button>
            </div>
          </div>

          <div className={styles.feePill}>
            <span>Total Modular Fee:</span>
            <strong>{liveModularTotalSol.toFixed(2)} SOL</strong>
          </div>
        </div>

        {/* Interactive 3-Step Header */}
        <div className={styles.stepIndicatorContainer}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`${styles.stepIndicator} ${
                  currentStep >= step.id ? styles.active : ""
                }`}
              >
                <div className={styles.stepNumber}>{currentStep > step.id ? "✓" : step.id}</div>
                <div className={styles.stepTitle}>{step.title}</div>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`${styles.stepConnector} ${
                    currentStep > step.id ? styles.stepConnectorActive : ""
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {createError && (
            <Notification type="error" message={createError} onClose={clearError} />
          )}

          <TransactionStatusStepper
            isActive={isCreatingToken}
            currentStepIndex={progressStep}
            statusMessage={statusStep}
            operationTitle={`Minting ${watchedFields.symbol || "Token"} on Solana (${cluster})`}
          />

          {currentStep === 1 && (
            <section className={styles.formSection}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label htmlFor="name">Token Name (Base: {MODULAR_FEE_BASE_CREATE_SOL.toFixed(2)} SOL)</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input id="name" placeholder="Ex: Solana Nexus" maxLength={32} {...field} />
                    )}
                  />
                  {errors.name && <p className={styles.error}>{errors.name.message}</p>}
                </div>

                <div className={styles.field}>
                  <Label htmlFor="symbol">Token Symbol (Ticker)</Label>
                  <Controller
                    name="symbol"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="symbol"
                        placeholder="Ex: SNX"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        maxLength={10}
                      />
                    )}
                  />
                  {errors.symbol && <p className={styles.error}>{errors.symbol.message}</p>}
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label htmlFor="decimals">Decimals (0 – 9)</Label>
                  <Controller
                    name="decimals"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="decimals"
                        type="number"
                        placeholder="9"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        min={0}
                        max={9}
                      />
                    )}
                  />
                  {errors.decimals && <p className={styles.error}>{errors.decimals.message}</p>}
                </div>

                <div className={styles.field}>
                  <Label htmlFor="supply">Initial Total Supply</Label>
                  <Controller
                    name="supply"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="supply"
                        placeholder="Ex: 1,000,000,000"
                        {...field}
                        onChange={(e) => {
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
                <Label>Metadata & Image Storage Pipeline</Label>
                <Controller
                  name="storageProvider"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={field.value === "arweave" ? styles.active : ""}
                        onClick={() => field.onChange("arweave")}
                      >
                        Arweave / Irys + Auto HTTPS Fallback
                      </button>
                      <button
                        type="button"
                        className={field.value === "cloudinary" ? styles.active : ""}
                        onClick={() => field.onChange("cloudinary")}
                      >
                        Direct HTTPS CDN (Fastest on Devnet)
                      </button>
                    </div>
                  )}
                />
              </div>

              <div className={styles.field}>
                <Label htmlFor="imageUrl">Token Logo Image (PNG, JPG, WEBP, GIF — Max 5MB)</Label>
                <div
                  {...getRootProps()}
                  className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""} ${
                    errors.imageUrl ? styles.dropzoneError : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className={styles.uploadingState}>
                      <div className={styles.spinner}></div>
                      <p>Uploading & verifying token image...</p>
                      <ProgressBar progress={uploadProgress} />
                    </div>
                  ) : watchedFields.imageUrl ? (
                    <div className={styles.preview}>
                      <img src={watchedFields.imageUrl} alt="Token Logo Preview" />
                      <button type="button" onClick={removeImage} className={styles.removeButton}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <p>Drag & drop your token logo here, or click to select a file</p>
                  )}
                </div>
                {watchedFields.imageUrl && (
                  <p className={styles.fieldDescription}>
                    ✓ Verified Image URI: <code>{watchedFields.imageUrl}</code>
                  </p>
                )}
                {uploadError && <p className={styles.error}>{uploadError}</p>}
                {errors.imageUrl && <p className={styles.error}>{errors.imageUrl.message}</p>}
              </div>

              <div className={styles.field}>
                <Label htmlFor="description">Description (Optional)</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="description"
                      placeholder="Brief description of your project and token utility"
                      {...field}
                    />
                  )}
                />
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label htmlFor="website">Website URL (Optional)</Label>
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <Input id="website" placeholder="https://yourproject.com" {...field} />
                    )}
                  />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="twitter">X / Twitter (Optional)</Label>
                  <Controller
                    name="twitter"
                    control={control}
                    render={({ field }) => <Input id="twitter" placeholder="@yourhandle" {...field} />}
                  />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="instagram">Instagram (Optional)</Label>
                  <Controller
                    name="instagram"
                    control={control}
                    render={({ field }) => (
                      <Input id="instagram" placeholder="yourprofile" {...field} />
                    )}
                  />
                </div>
              </div>

              {/* Phase 1: Custom Creator Info Upsell Toggle (+0.05 SOL) */}
              <div className={styles.authorityOption}>
                <div className={styles.authorityText}>
                  <Label htmlFor="customCreatorEnabled">
                    Customizar &quot;Creator Info&quot; nos Metadados (+
                    {MODULAR_FEE_CUSTOM_CREATOR_SOL.toFixed(2)} SOL)
                  </Label>
                  <p>
                    Substitui a assinatura padrão nos metadados pelo nome e site oficial do seu
                    projeto/estúdio.
                  </p>
                </div>
                <Controller
                  name="customCreator.enabled"
                  control={control}
                  render={({ field }) => (
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        id="customCreatorEnabled"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  )}
                />
              </div>

              {watchedFields.customCreator?.enabled && (
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <Label htmlFor="customCreatorName">Creator / Studio Name</Label>
                    <Controller
                      name="customCreator.name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="customCreatorName"
                          placeholder="Ex: Nexus Labs Official"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <div className={styles.field}>
                    <Label htmlFor="customCreatorWebsite">Creator Official URL</Label>
                    <Controller
                      name="customCreator.website"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="customCreatorWebsite"
                          placeholder="https://nexuslabs.io"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {currentStep === 3 && (
            <section className={styles.formSection}>
              <div className={styles.field}>
                <Label>Solana Token Program Standard</Label>
                <Controller
                  name="tokenStandard"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.segmentedControl}>
                      <button
                        type="button"
                        className={field.value === "spl" ? styles.active : ""}
                        onClick={() => field.onChange("spl")}
                      >
                        Standard SPL (Universal Wallet & DEX Support)
                      </button>
                      <button
                        type="button"
                        className={field.value === "token-2022" ? styles.active : ""}
                        onClick={() => field.onChange("token-2022")}
                      >
                        Token-2022 (+{MODULAR_FEE_TRANSFER_FEE_EXT_SOL.toFixed(2)} SOL Tax Token Ext)
                      </button>
                    </div>
                  )}
                />
              </div>

              {watchedFields.tokenStandard === "token-2022" && (
                <div className={styles.advancedContent}>
                  <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                    <div className={styles.authorityOption}>
                      <div className={styles.authorityText}>
                        <Label htmlFor="useNativeMetadataExtension">
                          Use Native Token-2022 MetadataPointer Extension Instead of Metaplex PDA
                        </Label>
                        <p>
                          Leave off for maximum logo visibility in Phantom and Solscan Devnet, or
                          enable to embed metadata directly inside the Token-2022 Mint account.
                        </p>
                      </div>
                      <Controller
                        name="useNativeMetadataExtension"
                        control={control}
                        render={({ field }) => (
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              id="useNativeMetadataExtension"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        )}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <Label htmlFor="transferFeeBasisPoints">
                      Transfer Fee / Tax Token (+{MODULAR_FEE_TRANSFER_FEE_EXT_SOL.toFixed(2)} SOL when &gt; 0)
                    </Label>
                    <Controller
                      name="transferFee.basisPoints"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="Ex: 100 for 1%"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                          }
                          min={0}
                          max={10000}
                        />
                      )}
                    />
                    <p className={styles.fieldDescription}>100 bps = 1% tax per transfer.</p>
                  </div>
                  <div className={styles.field}>
                    <Label htmlFor="transferFeeMaxFee">Maximum Transfer Fee (Token Units)</Label>
                    <Controller
                      name="transferFee.maxFee"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder="Ex: 5000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                          }
                          min={0}
                        />
                      )}
                    />
                    <p className={styles.fieldDescription}>Cap per transfer in whole tokens.</p>
                  </div>
                </div>
              )}

              {/* Phase 1: Modular Security & Authority Revocation Toggles (ON by Default) */}
              <div className={styles.authoritySection}>
                <h3 className={styles.authorityTitle}>
                  Blindagem On-Chain & RugCheck 100/100 (Upsell Modular)
                </h3>
                <div className={styles.authorityOptionsGrid}>
                  {/* 1. Revoke Freeze Authority (+0.10 SOL - Default ON) */}
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="revokeFreezeToggle">
                        Revogar Freeze Authority (+{MODULAR_FEE_REVOKE_FREEZE_SOL.toFixed(2)} SOL — Recomendado)
                      </Label>
                      <p>
                        Obrigatório para criar Pool de Liquidez na Raydium/Meteora e negociar na
                        Jupiter (+50 pts no RugCheck).
                      </p>
                    </div>
                    <Controller
                      name="freezeAuthority"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="revokeFreezeToggle"
                            checked={!field.value}
                            onChange={(e) => field.onChange(!e.target.checked)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      )}
                    />
                  </div>

                  {/* 2. Revoke Mint Authority (+0.10 SOL - Default ON) */}
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="revokeMintToggle">
                        Revogar Mint Authority (+{MODULAR_FEE_REVOKE_MINT_SOL.toFixed(2)} SOL — Recomendado)
                      </Label>
                      <p>
                        Torna o Supply 100% fixo e impossibilita emissão de novos tokens (+35 pts no
                        RugCheck).
                      </p>
                    </div>
                    <Controller
                      name="mintAuthority"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="revokeMintToggle"
                            checked={!field.value}
                            onChange={(e) => field.onChange(!e.target.checked)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      )}
                    />
                  </div>

                  {/* 3. Immutable Metadata (+0.05 SOL - Default ON) */}
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="immutableMetadataToggle">
                        Metadados Imutáveis / Immutable (+
                        {MODULAR_FEE_IMMUTABLE_METADATA_SOL.toFixed(2)} SOL)
                      </Label>
                      <p>
                        Trava permanentemente nome, símbolo e imagem nos exploradores (+15 pts no
                        RugCheck).
                      </p>
                    </div>
                    <Controller
                      name="isMetadataMutable"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="immutableMetadataToggle"
                            checked={!field.value}
                            onChange={(e) => field.onChange(!e.target.checked)}
                          />
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
            {currentStep > 1 && (
              <Button
                type="button"
                className="secondary"
                onClick={prevStep}
                disabled={isCreatingToken}
              >
                ← Back
              </Button>
            )}
            {currentStep < STEPS.length && (
              <Button type="button" onClick={nextStep} disabled={isCreatingToken}>
                Continue →
              </Button>
            )}
            {currentStep === STEPS.length && (
              <Button type="submit" disabled={isCreatingToken || isUploading}>
                {isCreatingToken ? (
                  <div className={styles.buttonContent}>
                    <div className={styles.buttonSpinner} />
                    <span>{statusStep || "Verifying & Signing Transaction..."}</span>
                  </div>
                ) : isUploading ? (
                  "Uploading Token Image..."
                ) : (
                  `Create Token on ${cluster === "devnet" ? "Devnet" : "Mainnet"} (Total: ${liveModularTotalSol.toFixed(2)} SOL)`
                )}
              </Button>
            )}
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
          mintAuthority={watchedFields.mintAuthority}
          freezeAuthority={watchedFields.freezeAuthority}
          isMetadataMutable={watchedFields.isMetadataMutable}
        />
      </div>
    </div>
  );
}
