"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateToken } from "@/hooks/useCreateToken";
import { useArweaveUpload } from "@/hooks/useArweaveUpload";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  MODULAR_FEE_BASE_CREATE_SOL,
  MODULAR_FEE_REVOKE_FREEZE_SOL,
  MODULAR_FEE_REVOKE_MINT_SOL,
  MODULAR_FEE_IMMUTABLE_METADATA_SOL,
  MODULAR_FEE_CUSTOM_CREATOR_SOL,
  MODULAR_FEE_TRANSFER_FEE_EXT_SOL,
  MODULAR_FEE_SOULBOUND_EXT_SOL,
  MODULAR_FEE_PERMANENT_DELEGATE_EXT_SOL,
  MODULAR_FEE_VANITY_MINT_SOL,
  MODULAR_FEE_JITO_BUNDLE_SOL,
  MODULAR_FEE_JITO_MULTI_WALLET_SOL,
  calculateModularTokenCreationFee,
} from "@/lib/constants";
import {
  startVanityMintGenerator,
  validateBase58Input,
} from "@/workers/vanityMint.worker";
import {
  generateAntiBubblemapsBuyerWallets,
  GeneratedBuyerWallet,
} from "@/lib/solana/jitoBundler";
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
    .min(1, "O nome do token é obrigatório.")
    .max(32, "O nome do token não pode ultrapassar 32 caracteres."),
  symbol: z
    .string()
    .trim()
    .min(1, "O Ticker (Símbolo) é obrigatório.")
    .max(10, "O Ticker excedeu o limite máximo de 10 caracteres."),
  description: z.string().max(500).optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  decimals: z
    .number({ invalid_type_error: "Os decimais devem ser um número inteiro entre 0 e 9." })
    .min(0, "Os decimais devem ser entre 0 e 9.")
    .max(9, "Os decimais não podem ser maiores que 9.")
    .int("Os decimais devem ser um número inteiro."),
  supply: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/,/g, ""));
      return !isNaN(num) && num > 0;
    },
    {
      message: "O supply inicial deve ser maior que zero.",
    }
  ),
  imageUrl: z
    .string()
    .trim()
    .min(1, "A imagem de logo do token é obrigatória antes de prosseguir.")
    .url("URL da imagem inválida."),
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
  soulbound: z.boolean().optional(),
  permanentDelegate: z.boolean().optional(),
  jitoBundle: z
    .object({
      enabled: z.boolean(),
      liquiditySol: z.number().min(0.01),
      poolSupplyPercent: z.number().min(1).max(100),
      firstBuySol: z.number().min(0),
      jitoTipSol: z.number().min(0.001).max(0.05),
      isMultiWalletBundle: z.boolean().optional(),
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

export default function TokenForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientValidationAlert, setClientValidationAlert] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const { cluster, setCluster } = useCluster();
  const { t, locale } = useLanguage();
  const isDevnet = cluster === "devnet";
  const isPt = locale === "pt" || locale === "pt-BR";

  // Phase 2: Vanity Mint Address Generator state
  const [vanityEnabled, setVanityEnabled] = useState(false);
  const [vanityMode, setVanityMode] = useState<"prefix" | "suffix">("prefix");
  const [vanityPattern, setVanityPattern] = useState("");
  const [vanityCaseSensitive, setVanityCaseSensitive] = useState(false);
  const [vanitySearching, setVanitySearching] = useState(false);
  const [vanityStats, setVanityStats] = useState<{
    tested: number;
    keysPerSecond: number;
    estimatedSeconds: number;
  } | null>(null);
  const [vanityFound, setVanityFound] = useState<{
    publicKey: string;
    secretKey: number[];
    charLength: number;
  } | null>(null);
  const vanityControllerRef = useRef<{ stop: () => void } | null>(null);

  // Phase 2: Jito Multi-Wallet Anti-Bubblemaps (4–8 Wallets) state
  const [multiWalletCount, setMultiWalletCount] = useState<number>(4);
  const [buyerWallets, setBuyerWallets] = useState<GeneratedBuyerWallet[]>([]);
  const [buyerKeysDownloaded, setBuyerKeysDownloaded] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      vanityControllerRef.current?.stop();
    };
  }, []);

  const vanityValidation = useMemo(
    () => validateBase58Input(vanityPattern.trim()),
    [vanityPattern]
  );

  const handleStartVanitySearch = () => {
    const cleaned = vanityPattern.trim();
    if (!cleaned || !vanityValidation.valid) return;

    vanityControllerRef.current?.stop();
    setVanitySearching(true);
    setVanityFound(null);
    setVanityStats({ tested: 0, keysPerSecond: 0, estimatedSeconds: 1 });

    vanityControllerRef.current = startVanityMintGenerator(
      {
        prefix: vanityMode === "prefix" ? cleaned : "",
        suffix: vanityMode === "suffix" ? cleaned : "",
        caseSensitive: vanityCaseSensitive,
      },
      (progress) => {
        setVanityStats({
          tested: progress.tested,
          keysPerSecond: progress.keysPerSecond,
          estimatedSeconds: progress.estimatedSeconds,
        });
      },
      (found) => {
        setVanitySearching(false);
        setVanityFound({
          publicKey: found.publicKey,
          secretKey: found.secretKey,
          charLength: cleaned.length,
        });
      }
    );
  };

  const handleStopVanitySearch = () => {
    vanityControllerRef.current?.stop();
    setVanitySearching(false);
  };

  const STEPS = useMemo(
    () => [
      { id: 1, title: t.form.step1 },
      { id: 2, title: t.form.step2 },
      { id: 3, title: t.form.step3 },
    ],
    [t]
  );

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
    setError: setFieldError,
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
      isMetadataMutable: false,
      tokenStandard: "spl",
      useNativeMetadataExtension: false,
      customCreator: {
        enabled: false,
        name: "",
        website: "",
      },
      transferFee: { basisPoints: 0, maxFee: 0 },
      soulbound: false,
      permanentDelegate: false,
      jitoBundle: {
        enabled: false,
        liquiditySol: 1.0,
        poolSupplyPercent: 80,
        firstBuySol: 0.2,
        jitoTipSol: 0.002,
        isMultiWalletBundle: false,
      },
    },
    mode: "onChange",
  });

  const watchedFields = watch();

  // Auto-generate buyer sub-wallets when Multi-Wallet Anti-Bubblemaps is enabled
  useEffect(() => {
    if (watchedFields.jitoBundle?.enabled && watchedFields.jitoBundle?.isMultiWalletBundle) {
      const generated = generateAntiBubblemapsBuyerWallets(
        multiWalletCount,
        watchedFields.jitoBundle.firstBuySol || 0.2
      );
      setBuyerWallets(generated);
      setBuyerKeysDownloaded(false);
    }
  }, [
    watchedFields.jitoBundle?.enabled,
    watchedFields.jitoBundle?.isMultiWalletBundle,
    multiWalletCount,
    watchedFields.jitoBundle?.firstBuySol,
  ]);

  const handleDownloadBuyerWalletsJson = () => {
    if (buyerWallets.length === 0) return;
    const payload = {
      platform: "CreateTokenSolana (https://www.createtokensol.store)",
      module: "Jito Multi-Wallet Anti-Bubblemaps Bundle",
      network: cluster,
      tokenSymbol: watchedFields.symbol || "TOKEN",
      generatedAt: new Date().toISOString(),
      walletCount: buyerWallets.length,
      wallets: buyerWallets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `createtokensol-jito-buyer-wallets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBuyerKeysDownloaded(true);
  };

  const activeVanityCharLen =
    vanityEnabled && vanityFound
      ? vanityFound.charLength
      : vanityEnabled
      ? vanityPattern.trim().length
      : 0;

  const modularOptions = useMemo(
    () => ({
      revokeFreeze: !watchedFields.freezeAuthority,
      revokeMint: !watchedFields.mintAuthority,
      immutableMetadata: !watchedFields.isMetadataMutable,
      customCreatorInfo: Boolean(watchedFields.customCreator?.enabled),
      hasTransferFeeExtension:
        watchedFields.tokenStandard === "token-2022" &&
        Boolean((watchedFields.transferFee?.basisPoints ?? 0) > 0),
      hasSoulboundExtension:
        watchedFields.tokenStandard === "token-2022" && Boolean(watchedFields.soulbound),
      hasPermanentDelegateExtension:
        watchedFields.tokenStandard === "token-2022" && Boolean(watchedFields.permanentDelegate),
      vanityCharLength: activeVanityCharLen,
      hasJitoBundle: Boolean(watchedFields.jitoBundle?.enabled),
      isMultiWalletBundle: Boolean(
        watchedFields.jitoBundle?.enabled && watchedFields.jitoBundle?.isMultiWalletBundle
      ),
    }),
    [
      watchedFields.freezeAuthority,
      watchedFields.mintAuthority,
      watchedFields.isMetadataMutable,
      watchedFields.customCreator?.enabled,
      watchedFields.tokenStandard,
      watchedFields.transferFee?.basisPoints,
      watchedFields.soulbound,
      watchedFields.permanentDelegate,
      activeVanityCharLen,
      watchedFields.jitoBundle?.enabled,
      watchedFields.jitoBundle?.isMultiWalletBundle,
    ]
  );

  const { totalSol: liveModularTotalSol } = useMemo(
    () => calculateModularTokenCreationFee(modularOptions),
    [modularOptions]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("modular-fee-update", { detail: modularOptions })
      );
    }
  }, [modularOptions]);

  const validateStrictStep1 = (): boolean => {
    let valid = true;
    const rawSymbol = (watchedFields.symbol || "").trim();
    const rawDecimals = Number(watchedFields.decimals);

    if (!rawSymbol) {
      setFieldError("symbol", {
        type: "manual",
        message: "O Ticker (Símbolo) é obrigatório.",
      });
      valid = false;
    } else if (rawSymbol.length > 10) {
      setFieldError("symbol", {
        type: "manual",
        message: "O Ticker excedeu o limite máximo de 10 caracteres.",
      });
      valid = false;
    }

    if (
      watchedFields.decimals === undefined ||
      watchedFields.decimals === null ||
      Number.isNaN(rawDecimals) ||
      !Number.isInteger(rawDecimals) ||
      rawDecimals < 0 ||
      rawDecimals > 9
    ) {
      setFieldError("decimals", {
        type: "manual",
        message: "Decimais inválidos: informe um número inteiro entre 0 e 9.",
      });
      valid = false;
    }

    return valid;
  };

  const nextStep = async () => {
    setClientValidationAlert(null);
    let fieldsToValidate: (keyof TokenFormData)[] = [];
    if (currentStep === 1) {
      if (!validateStrictStep1()) {
        setClientValidationAlert(
          "Corrija os campos destacados em vermelho antes de avançar."
        );
        return;
      }
      fieldsToValidate = ["name", "symbol", "decimals", "supply"];
    } else if (currentStep === 2) {
      if (!watchedFields.imageUrl || watchedFields.imageUrl.trim() === "") {
        setFieldError("imageUrl", {
          type: "manual",
          message: "Envie a imagem de logo do token antes de continuar.",
        });
        setClientValidationAlert(
          "A imagem de logo do token é obrigatória para criar os metadados on-chain."
        );
        return;
      }
      fieldsToValidate = ["imageUrl", "description", "website", "twitter", "instagram"];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setClientValidationAlert(null);
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
      setClientValidationAlert(null);
      try {
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(URL.createObjectURL(file));
      } catch {
        // Ignore object URL errors
      }
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
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setValue("imageUrl", "", { shouldValidate: true });
  };

  const isMultiWalletActive = Boolean(
    watchedFields.jitoBundle?.enabled && watchedFields.jitoBundle?.isMultiWalletBundle
  );

  const handleStrictFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientValidationAlert(null);

    const rawSymbol = (watchedFields.symbol || "").trim();
    const rawDecimals = Number(watchedFields.decimals);
    const rawImage = (watchedFields.imageUrl || "").trim();

    if (!rawSymbol || rawSymbol.length > 10) {
      setFieldError("symbol", {
        type: "manual",
        message: "O Ticker deve ter entre 1 e 10 caracteres.",
      });
      setCurrentStep(1);
      setClientValidationAlert("Ticker inválido: verifique o limite de 10 caracteres.");
      return;
    }

    if (
      Number.isNaN(rawDecimals) ||
      !Number.isInteger(rawDecimals) ||
      rawDecimals < 0 ||
      rawDecimals > 9
    ) {
      setFieldError("decimals", {
        type: "manual",
        message: "Os decimais devem ser um inteiro válido entre 0 e 9.",
      });
      setCurrentStep(1);
      setClientValidationAlert("Decimais inválidos: informe um valor entre 0 e 9.");
      return;
    }

    if (!rawImage) {
      setFieldError("imageUrl", {
        type: "manual",
        message: "A imagem de logo do token é obrigatória.",
      });
      setCurrentStep(2);
      setClientValidationAlert("Envie uma imagem para o token antes de assinar a transação.");
      return;
    }

    if (isMultiWalletActive && !buyerKeysDownloaded) {
      setClientValidationAlert(
        "Baixe o arquivo .JSON com as chaves das carteiras compradoras antes de disparar o Jito Bundle Multi-Carteira."
      );
      return;
    }

    await handleSubmit(async (data: TokenFormData) => {
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
        soulbound: Boolean(data.soulbound),
        permanentDelegate: Boolean(data.permanentDelegate),
        vanityPublicKey:
          vanityEnabled && vanityFound ? vanityFound.publicKey : undefined,
        vanitySecretKey:
          vanityEnabled && vanityFound ? vanityFound.secretKey : undefined,
        vanityCharLength:
          vanityEnabled && vanityFound ? vanityFound.charLength : 0,
        jitoBundle: data.jitoBundle?.enabled
          ? {
              enabled: true,
              liquiditySol: Number(data.jitoBundle.liquiditySol) || 1.0,
              poolSupplyPercent: Number(data.jitoBundle.poolSupplyPercent) || 80,
              firstBuySol: Number(data.jitoBundle.firstBuySol) || 0.2,
              jitoTipSol: Number(data.jitoBundle.jitoTipSol) || 0.002,
              isMultiWalletBundle: Boolean(data.jitoBundle.isMultiWalletBundle),
              multiWalletBuys: data.jitoBundle.isMultiWalletBundle
                ? buyerWallets.map((w) => ({
                    secretKey: Uint8Array.from(w.secretKeyArray),
                    buyAmountSol: w.buyAmountSol,
                  }))
                : undefined,
            }
          : undefined,
      };
      await createToken(tokenDataForApi);
    })(e);
  };

  const isTransactionStepperVisible = isUploading || isCreatingToken;
  const activeStepperIndex = isUploading ? 1 : progressStep || 1;
  const activeStepperMessage = isUploading
    ? "1. Upload para Irys — Enviando imagem do token..."
    : statusStep;

  return (
    <div className={styles.formGrid}>
      <div
        className={styles.formWrapper}
        style={{
          borderColor: isDevnet ? "rgba(245, 158, 11, 0.55)" : undefined,
          boxShadow: isDevnet ? "0 12px 36px rgba(245, 158, 11, 0.12)" : undefined,
        }}
      >
        <div className={styles.formTopBar}>
          <div className={styles.networkInlineGroup}>
            <span className={styles.networkLabel}>{t.form.targetNetwork}</span>
            <div className={styles.networkSegment}>
              <button
                type="button"
                onClick={() => setCluster("mainnet-beta")}
                className={cluster === "mainnet-beta" ? styles.networkSegmentActive : ""}
              >
                <span className={styles.dotMainnet} />
                {t.network.mainnetShort}
              </button>
              <button
                type="button"
                onClick={() => setCluster("devnet")}
                className={cluster === "devnet" ? styles.networkSegmentDevnet : ""}
              >
                <span className={styles.dotDevnet} />
                {t.network.devnetShort}
              </button>
            </div>
          </div>

          <div className={styles.feePill}>
            <span>{t.form.totalModularFee}</span>
            <strong>{liveModularTotalSol.toFixed(2)} SOL</strong>
          </div>
        </div>


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

        <form onSubmit={handleStrictFormSubmit} className={styles.form} noValidate>
          {createError && (
            <Notification type="error" message={createError} onClose={clearError} />
          )}

          {clientValidationAlert && (
            <div className={styles.errorBanner} role="alert">
              ⚠️ {clientValidationAlert}
            </div>
          )}

          <TransactionStatusStepper
            isActive={isTransactionStepperVisible}
            currentStepIndex={activeStepperIndex}
            statusMessage={activeStepperMessage}
            operationTitle={
              watchedFields.jitoBundle?.enabled && isDevnet
                ? `Devnet Sequencial (Jito Block Engine é exclusivo da Mainnet-Beta)`
                : `Criando ${watchedFields.symbol || "Token"} na Solana (${cluster})`
            }
          />

          {currentStep === 1 && (
            <section className={styles.formSection}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label
                    htmlFor="name"
                    className={errors.name ? styles.labelError : undefined}
                  >
                    {t.form.tokenName} (Base: {MODULAR_FEE_BASE_CREATE_SOL.toFixed(2)} SOL)
                  </Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="name"
                        placeholder="Ex: Solana Nexus"
                        maxLength={32}
                        className={errors.name ? styles.inputError : undefined}
                        {...field}
                      />
                    )}
                  />
                  {errors.name && <p className={styles.error}>{errors.name.message}</p>}
                </div>

                <div className={styles.field}>
                  <Label
                    htmlFor="symbol"
                    className={errors.symbol ? styles.labelError : undefined}
                  >
                    {t.form.tokenSymbol} (Máx. 10)
                  </Label>
                  <Controller
                    name="symbol"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="symbol"
                        placeholder="Ex: SNX"
                        className={errors.symbol ? styles.inputError : undefined}
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          field.onChange(val);
                          if (val.length > 10) {
                            setFieldError("symbol", {
                              type: "manual",
                              message: "O Ticker excedeu o limite máximo de 10 caracteres.",
                            });
                          }
                        }}
                      />
                    )}
                  />
                  {errors.symbol && <p className={styles.error}>{errors.symbol.message}</p>}
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label
                    htmlFor="decimals"
                    className={errors.decimals ? styles.labelError : undefined}
                  >
                    {t.form.decimals}
                  </Label>
                  <Controller
                    name="decimals"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="decimals"
                        type="number"
                        placeholder="9"
                        className={errors.decimals ? styles.inputError : undefined}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? Number.NaN : Number(e.target.value)
                          )
                        }
                        min={0}
                        max={9}
                      />
                    )}
                  />
                  {errors.decimals && <p className={styles.error}>{errors.decimals.message}</p>}
                </div>

                <div className={styles.field}>
                  <Label
                    htmlFor="supply"
                    className={errors.supply ? styles.labelError : undefined}
                  >
                    {t.form.supply}
                  </Label>
                  <Controller
                    name="supply"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="supply"
                        placeholder="Ex: 1,000,000,000"
                        className={errors.supply ? styles.inputError : undefined}
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

              {/* Phase 2: Vanity Mint Address Generator (Web Worker / Non-Blocking) */}
              <div className={styles.authorityOption} style={{ marginTop: "0.75rem" }}>
                <div className={styles.authorityText}>
                  <Label htmlFor="vanityMintToggle">
                    ✨ Endereço de Contrato Personalizado (Vanity Mint Address)
                  </Label>
                  <p>
                    1 a 2 caracteres: <strong>Grátis (+0.00 SOL)</strong> · 3 a 4 caracteres:{" "}
                    <strong>+{MODULAR_FEE_VANITY_MINT_SOL.toFixed(2)} SOL</strong> (gerado localmente via Web Worker).
                  </p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    id="vanityMintToggle"
                    checked={vanityEnabled}
                    onChange={(e) => {
                      setVanityEnabled(e.target.checked);
                      if (!e.target.checked) {
                        handleStopVanitySearch();
                      }
                    }}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              {vanityEnabled && (
                <div
                  className={styles.advancedContent}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(20, 241, 149, 0.35)",
                    background: "rgba(9, 9, 11, 0.65)",
                  }}
                >
                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <Label>Posição dos Caracteres</Label>
                      <div className={styles.segmentedControl}>
                        <button
                          type="button"
                          className={vanityMode === "prefix" ? styles.active : ""}
                          onClick={() => setVanityMode("prefix")}
                        >
                          Começa com (Prefix)
                        </button>
                        <button
                          type="button"
                          className={vanityMode === "suffix" ? styles.active : ""}
                          onClick={() => setVanityMode("suffix")}
                        >
                          Termina com (Suffix)
                        </button>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <Label htmlFor="vanityPattern">
                        Caracteres Base58 (1–2 Grátis | 3–4: +0.05 SOL)
                      </Label>
                      <Input
                        id="vanityPattern"
                        placeholder="Ex: sol, pump, ai"
                        maxLength={4}
                        value={vanityPattern}
                        onChange={(e) => {
                          setVanityPattern(e.target.value);
                          setVanityFound(null);
                        }}
                      />
                    </div>
                  </div>

                  {!vanityValidation.valid && (
                    <p className={styles.error} style={{ marginTop: "0.4rem" }}>
                      ⚠️ {vanityValidation.error}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={vanityCaseSensitive}
                        onChange={(e) => setVanityCaseSensitive(e.target.checked)}
                      />
                      <span>Diferenciar Maiúsculas/Minúsculas (Case-Sensitive)</span>
                    </label>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {vanitySearching ? (
                        <Button type="button" className="secondary" onClick={handleStopVanitySearch}>
                          ⏹ Parar Busca
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleStartVanitySearch}
                          disabled={!vanityPattern.trim() || !vanityValidation.valid}
                        >
                          🔍 Gerar Endereço Vanity
                        </Button>
                      )}
                    </div>
                  </div>

                  {vanityStats && vanitySearching && (
                    <p className={styles.fieldDescription} style={{ marginTop: "0.55rem" }}>
                      ⚡ Testados: <strong>{vanityStats.tested.toLocaleString()}</strong> chaves · Velocidade:{" "}
                      <strong>{vanityStats.keysPerSecond.toLocaleString()} chaves/s</strong> · Tempo est.: ~
                      {vanityStats.estimatedSeconds}s
                    </p>
                  )}

                  {vanityFound && (
                    <div
                      style={{
                        marginTop: "0.65rem",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        background: "rgba(20, 241, 149, 0.14)",
                        border: "1px solid rgba(20, 241, 149, 0.45)",
                        color: "#14f195",
                        fontSize: "0.8rem",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      ✓ Vanity Mint Encontrado ({vanityFound.charLength <= 2 ? "Grátis" : "+0.05 SOL"}):{" "}
                      <strong>{vanityFound.publicKey}</strong>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {currentStep === 2 && (
            <section className={styles.formSection}>
              <div className={styles.field}>
                <Label>{t.form.storagePipeline}</Label>
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
                <Label
                  htmlFor="imageUrl"
                  className={errors.imageUrl || uploadError ? styles.labelError : undefined}
                >
                  {t.form.logoLabel} *
                </Label>
                <div
                  {...getRootProps()}
                  className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""} ${
                    errors.imageUrl || uploadError ? styles.dropzoneError : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className={styles.uploadingState}>
                      <div className={styles.spinner}></div>
                      <p>{t.form.uploadingImg}</p>
                      <ProgressBar progress={uploadProgress} />
                    </div>
                  ) : watchedFields.imageUrl ? (
                    <div className={styles.preview}>
                      <img
                        src={watchedFields.imageUrl}
                        alt="Token Logo Preview"
                        onError={(e) => {
                          if (localPreviewUrl && e.currentTarget.src !== localPreviewUrl) {
                            e.currentTarget.src = localPreviewUrl;
                          }
                        }}
                      />
                      <button type="button" onClick={removeImage} className={styles.removeButton}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <p>{t.form.dropzonePrompt}</p>
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
                <Label htmlFor="description">{t.form.description}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="description"
                      placeholder="Breve descrição do seu projeto e utilidade do token"
                      {...field}
                    />
                  )}
                />
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Label htmlFor="website">{t.form.website}</Label>
                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <Input id="website" placeholder="https://seuprojeto.com" {...field} />
                    )}
                  />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="twitter">{t.form.twitter}</Label>
                  <Controller
                    name="twitter"
                    control={control}
                    render={({ field }) => <Input id="twitter" placeholder="@seuperfil" {...field} />}
                  />
                </div>
                <div className={styles.field}>
                  <Label htmlFor="instagram">{t.form.instagram}</Label>
                  <Controller
                    name="instagram"
                    control={control}
                    render={({ field }) => (
                      <Input id="instagram" placeholder="seuinstagram" {...field} />
                    )}
                  />
                </div>
              </div>

              <div className={styles.authorityOption}>
                <div className={styles.authorityText}>
                  <Label htmlFor="customCreatorEnabled">
                    {t.form.customCreatorTitle} (+{MODULAR_FEE_CUSTOM_CREATOR_SOL.toFixed(2)} SOL)
                  </Label>
                  <p>{t.form.customCreatorDesc}</p>
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
                    <Label htmlFor="customCreatorName">{t.form.creatorName}</Label>
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
                    <Label htmlFor="customCreatorWebsite">{t.form.creatorUrl}</Label>
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
                <Label>{t.form.tokenStandard}</Label>
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
                        {t.form.standardSpl}
                      </button>
                      <button
                        type="button"
                        className={field.value === "token-2022" ? styles.active : ""}
                        onClick={() => field.onChange("token-2022")}
                      >
                        {t.form.standard2022} (+{MODULAR_FEE_TRANSFER_FEE_EXT_SOL.toFixed(2)} SOL)
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

                  <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                    <div className={styles.authorityOption}>
                      <div className={styles.authorityText}>
                        <Label htmlFor="soulboundToggle">
                          🔒 Non-Transferable Token / Soulbound (+
                          {MODULAR_FEE_SOULBOUND_EXT_SOL.toFixed(2)} SOL)
                        </Label>
                        <p>
                          Usa <code>createInitializeNonTransferableMintInstruction</code> para criar tokens intransferíveis (badges KYC, reputação e governança).
                        </p>
                      </div>
                      <Controller
                        name="soulbound"
                        control={control}
                        render={({ field }) => (
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              id="soulboundToggle"
                              checked={Boolean(field.value)}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        )}
                      />
                    </div>
                  </div>

                  <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                    <div className={styles.authorityOption}>
                      <div className={styles.authorityText}>
                        <Label htmlFor="permanentDelegateToggle">
                          🏛️ Permanent Delegate (+
                          {MODULAR_FEE_PERMANENT_DELEGATE_EXT_SOL.toFixed(2)} SOL)
                        </Label>
                        <p>
                          Usa <code>createInitializePermanentDelegateInstruction</code> para stablecoins reguladas (atenção: reduz o score no RugCheck para memecoins).
                        </p>
                      </div>
                      <Controller
                        name="permanentDelegate"
                        control={control}
                        render={({ field }) => (
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              id="permanentDelegateToggle"
                              checked={Boolean(field.value)}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        )}
                      />
                    </div>
                  </div>

                  {(watchedFields.soulbound || watchedFields.permanentDelegate) && (
                    <div
                      role="alert"
                      style={{
                        gridColumn: "1 / -1",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(245, 158, 11, 0.55)",
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#fde68a",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️{" "}
                      <strong>
                        {isPt
                          ? "Aviso de Incompatibilidade com Pools Raydium CPMM:"
                          : "Raydium CPMM Pool Incompatibility Warning:"}
                      </strong>{" "}
                      {isPt
                        ? "As extensões Soulbound (NonTransferable) e Permanent Delegate são rejeitadas pelo protocolo Raydium CPMM (erro NotSupportMint). Desative essas opções se você pretende criar uma Pool de Liquidez para este token."
                        : "Soulbound (NonTransferable) and Permanent Delegate extensions are rejected by the Raydium CPMM protocol (NotSupportMint error). Disable both options if you plan to create a Raydium liquidity pool."}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.authoritySection}>
                <h3 className={styles.authorityTitle}>{t.form.securityTitle}</h3>
                <div className={styles.authorityOptionsGrid}>
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="revokeFreezeToggle">
                        {t.form.revokeFreezeTitle} (+{MODULAR_FEE_REVOKE_FREEZE_SOL.toFixed(2)} SOL)
                      </Label>
                      <p>{t.form.revokeFreezeDesc}</p>
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

                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="revokeMintToggle">
                        {t.form.revokeMintTitle} (+{MODULAR_FEE_REVOKE_MINT_SOL.toFixed(2)} SOL)
                      </Label>
                      <p>{t.form.revokeMintDesc}</p>
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

                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="immutableMetadataToggle">
                        {t.form.immutableTitle} (+{MODULAR_FEE_IMMUTABLE_METADATA_SOL.toFixed(2)} SOL)
                      </Label>
                      <p>{t.form.immutableDesc}</p>
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

                  {/* Phase 2 & 3: Jito Atomic Bundle (Single or Multi-Wallet Anti-Bubblemaps) */}
                  <div className={styles.authorityOption}>
                    <div className={styles.authorityText}>
                      <Label htmlFor="jitoBundleToggle">
                        ⚡ Lançamento Blindado Anti-Sniper (Jito Atomic Bundle: Mint + Pool + 1ª Compra) (+
                        {watchedFields.jitoBundle?.isMultiWalletBundle
                          ? MODULAR_FEE_JITO_MULTI_WALLET_SOL.toFixed(2)
                          : MODULAR_FEE_JITO_BUNDLE_SOL.toFixed(2)}{" "}
                        SOL)
                      </Label>
                      <p>
                        Executa Mint + Pool de Liquidez Raydium CPMM + Compra no Bloco Zero via Jito Block Engine para impedir front-running de bots MEV.
                      </p>
                    </div>
                    <Controller
                      name="jitoBundle.enabled"
                      control={control}
                      render={({ field }) => (
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            id="jitoBundleToggle"
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      )}
                    />
                  </div>
                </div>

                {watchedFields.jitoBundle?.enabled && (
                  <div
                    className={styles.advancedContent}
                    style={{
                      marginTop: "0.85rem",
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(153, 69, 255, 0.45)",
                      background: "rgba(153, 69, 255, 0.08)",
                    }}
                  >
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <Label htmlFor="jitoLiquiditySol">Liquidez Inicial no Pool (SOL)</Label>
                        <Controller
                          name="jitoBundle.liquiditySol"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="jitoLiquiditySol"
                              type="number"
                              step="0.1"
                              min={0.05}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0.5)}
                            />
                          )}
                        />
                      </div>

                      <div className={styles.field}>
                        <Label htmlFor="jitoPoolSupplyPercent">% do Supply para o Pool</Label>
                        <Controller
                          name="jitoBundle.poolSupplyPercent"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="jitoPoolSupplyPercent"
                              type="number"
                              min={10}
                              max={100}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 80)}
                            />
                          )}
                        />
                      </div>

                      <div className={styles.field}>
                        <Label htmlFor="jitoFirstBuySol">Compra Total no Bloco Zero (SOL)</Label>
                        <Controller
                          name="jitoBundle.firstBuySol"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="jitoFirstBuySol"
                              type="number"
                              step="0.05"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          )}
                        />
                      </div>

                      <div className={styles.field}>
                        <Label htmlFor="jitoTipSol">Gorjeta Validador Jito (0.001–0.01 SOL)</Label>
                        <Controller
                          name="jitoTipSol"
                          control={control}
                          render={() => (
                            <Controller
                              name="jitoBundle.jitoTipSol"
                              control={control}
                              render={({ field }) => (
                                <Input
                                  id="jitoTipSol"
                                  type="number"
                                  step="0.001"
                                  min={0.001}
                                  max={0.01}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0.002)}
                                />
                              )}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Phase 2: Multi-Wallet Anti-Bubblemaps Buy Toggle (4-8 Wallets) */}
                    <div
                      style={{
                        marginTop: "0.9rem",
                        padding: "0.85rem",
                        borderRadius: "0.65rem",
                        background: "rgba(9, 9, 11, 0.72)",
                        border: "1px solid rgba(20, 241, 149, 0.4)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "0.86rem", color: "#14f195" }}>
                            🛡️ Multi-Wallet Anti-Bubblemaps Buy (4–8 Wallets) (+
                            {MODULAR_FEE_JITO_MULTI_WALLET_SOL.toFixed(2)} SOL)
                          </strong>
                          <p
                            style={{
                              fontSize: "0.76rem",
                              color: "hsl(var(--muted-foreground))",
                              marginTop: "0.15rem",
                            }}
                          >
                            Distribui a compra do Bloco Zero em 4 a 8 sub-carteiras independentes via{" "}
                            <code>swapBaseInput</code> oficial do Raydium CPMM.
                          </p>
                        </div>
                        <Controller
                          name="jitoBundle.isMultiWalletBundle"
                          control={control}
                          render={({ field }) => (
                            <label className={styles.switch}>
                              <input
                                type="checkbox"
                                checked={Boolean(field.value)}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                              <span className={styles.slider}></span>
                            </label>
                          )}
                        />
                      </div>

                      {watchedFields.jitoBundle?.isMultiWalletBundle && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "0.75rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <span style={{ fontSize: "0.78rem" }}>Sub-Carteiras:</span>
                              {[4, 6, 8].map((cnt) => (
                                <button
                                  key={cnt}
                                  type="button"
                                  onClick={() => setMultiWalletCount(cnt)}
                                  style={{
                                    padding: "0.28rem 0.65rem",
                                    borderRadius: "0.45rem",
                                    fontSize: "0.76rem",
                                    fontWeight: 700,
                                    border:
                                      multiWalletCount === cnt
                                        ? "1px solid #14f195"
                                        : "1px solid rgba(255,255,255,0.2)",
                                    background:
                                      multiWalletCount === cnt
                                        ? "rgba(20, 241, 149, 0.18)"
                                        : "transparent",
                                    color: multiWalletCount === cnt ? "#14f195" : "#e2e8f0",
                                    cursor: "pointer",
                                  }}
                                >
                                  {cnt} Wallets
                                </button>
                              ))}
                            </div>

                            <Button
                              type="button"
                              onClick={handleDownloadBuyerWalletsJson}
                              style={{
                                background: buyerKeysDownloaded
                                  ? "rgba(20, 241, 149, 0.2)"
                                  : "linear-gradient(135deg, #14f195 0%, #00d1ff 100%)",
                                color: buyerKeysDownloaded ? "#14f195" : "#09090b",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                              }}
                            >
                              {buyerKeysDownloaded
                                ? "✓ Chaves Compradoras Baixadas (.JSON)"
                                : "⬇️ Baixar Chaves das Carteiras Compradoras (.JSON)"}
                            </Button>
                          </div>

                          <div
                            style={{
                              marginTop: "0.6rem",
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                              gap: "0.4rem",
                              fontSize: "0.74rem",
                              fontFamily: "monospace",
                            }}
                          >
                            {buyerWallets.map((w) => (
                              <div
                                key={w.publicKey}
                                style={{
                                  padding: "0.35rem 0.55rem",
                                  borderRadius: "0.4rem",
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                }}
                              >
                                #{w.index}: {w.publicKey.slice(0, 5)}...{w.publicKey.slice(-4)} →{" "}
                                <strong style={{ color: "#14f195" }}>
                                  {w.buyAmountSol.toFixed(3)} SOL
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                {t.form.backBtn}
              </Button>
            )}
            {currentStep < STEPS.length && (
              <Button type="button" onClick={nextStep} disabled={isCreatingToken}>
                {t.form.continueBtn}
              </Button>
            )}
            {currentStep === STEPS.length && (
              <Button
                type="submit"
                disabled={
                  isCreatingToken ||
                  isUploading ||
                  (isMultiWalletActive && !buyerKeysDownloaded)
                }
                style={
                  isDevnet
                    ? {
                        backgroundImage: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        color: "#09090b",
                        fontWeight: 700,
                      }
                    : undefined
                }
              >
                {isCreatingToken ? (
                  <div className={styles.buttonContent}>
                    <div className={styles.buttonSpinner} />
                    <span>{statusStep || "Processando transação na Solana..."}</span>
                  </div>
                ) : isUploading ? (
                  t.form.uploadingImg
                ) : isMultiWalletActive && !buyerKeysDownloaded ? (
                  "⬇️ Baixe o .JSON das Carteiras Compradoras Antes de Lançar"
                ) : (
                  `${isDevnet ? t.form.submitDevnet : t.form.submitMainnet} (${liveModularTotalSol.toFixed(2)} SOL)`
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
          decimals={watchedFields.decimals}
          description={watchedFields.description}
          tokenStandard={watchedFields.tokenStandard}
          mintAuthority={watchedFields.mintAuthority}
          freezeAuthority={watchedFields.freezeAuthority}
          isMetadataMutable={watchedFields.isMetadataMutable}
          transferFeeBps={watchedFields.transferFee?.basisPoints ?? 0}
          soulbound={Boolean(watchedFields.soulbound)}
          permanentDelegate={Boolean(watchedFields.permanentDelegate)}
          vanityMintAddress={vanityEnabled && vanityFound ? vanityFound.publicKey : undefined}
          jitoBundleEnabled={Boolean(watchedFields.jitoBundle?.enabled)}
        />
      </div>
    </div>
  );
}
