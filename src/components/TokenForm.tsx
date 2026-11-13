"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateToken } from "@/hooks/useCreateToken";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import { useCluster } from "@/context/WalletContext";
import { SERVICE_FEE_CREATE_TOKEN_SOL } from "@/lib/constants";
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
      mintAuthority: false,
      freezeAuthority: false,
      isMetadataMutable: true,
      tokenStandard: "spl",
      useNativeMetadataExtension: false,
      transferFee: { basisPoints: 0, maxFee: 0 },
    },
    mode: "onChange",
  });

  const watchedFields = watch();

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
        {/* Top Network & Fee Bar Inside Form Card */}
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
            <span>Service Fee:</span>
            <strong>{SERVICE_FEE_CREATE_TOKEN_SOL.toFixed(2)} SOL</strong>
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

          {/* Real-Time 5-Stage Visual Stepper During Token Creation */}
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
                  <Label htmlFor="name">Token Name</Label>
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
                        Token-2022 (Transfer Fees & Extensions)
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
                    <Label htmlFor="transferFeeBasisPoints">Transfer Fee (Basis Points)</Label>
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

              <div className={styles.authoritySection}>
                <h3 className={styles.authorityTitle}>On-Chain Security Authorities</h3>
                <div className={styles.authorityOptionsGrid}>
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="mintAuthority">Keep Mint Authority</Label>
                      <p>
                        Leave unchecked to permanently cap your token supply (recommended for
                        investor trust).
                      </p>
                    </div>
                    <Controller
                      name="mintAuthority"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="mintAuthority"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      )}
                    />
                  </div>
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="isMetadataMutable">Mutable Metadata</Label>
                      <p>
                        Allows updating token name, symbol, and logo URI later. Uncheck to lock
                        metadata forever.
                      </p>
                    </div>
                    <Controller
                      name="isMetadataMutable"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="isMetadataMutable"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      )}
                    />
                  </div>
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="freezeAuthority">Keep Freeze Authority</Label>
                      <p>
                        Keep disabled so your token is immediately compatible with Liquidity Pools.
                      </p>
                    </div>
                    <Controller
                      name="freezeAuthority"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="freezeAuthority"
                            checked={field.value}
                            onChange={field.onChange}
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
                  `Create Token on ${cluster === "devnet" ? "Devnet" : "Mainnet"} (${SERVICE_FEE_CREATE_TOKEN_SOL.toFixed(2)} SOL Fee)`
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
        />
      </div>
    </div>
  );
}
