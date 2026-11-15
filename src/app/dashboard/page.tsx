"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { getMint, Mint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ManageAuthorityModal from "@/components/ManageAuthorityModal";
import TransactionStatusStepper from "@/components/TransactionStatusStepper";
import CostSummary from "@/components/CostSummary";
import Notification from "@/components/ui/Notification";
import { TokenSelector } from "@/components/TokenSelector";
import { useManageAuthority } from "@/hooks/useManageAuthority";
import { useCluster } from "@/context/WalletContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUserTokens, RichToken } from "@/hooks/useUserTokens";
import { DEV_WALLET_ADDRESS, SERVICE_FEE_MANAGE_AUTHORITY_SOL } from "@/lib/constants";
import styles from "./Dashboard.module.css";

const devWalletBase58 = DEV_WALLET_ADDRESS.toBase58();

const IconLock = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const IconCheckCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const IconAlertTriangle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const GUIDE_ICONS = [<IconLock key="l" />, <IconCheckCircle key="c" />, <IconAlertTriangle key="a" />];

type AuthorityModalState = {
  isOpen: boolean;
  mint: string | null;
  type: "mint" | "freeze" | null;
  programId: string | null;
};

type NotificationState = {
  type: "success" | "error";
  message: string;
  txId?: string | null;
} | null;

const InfoState = ({
  message,
  showSpinner = false,
}: {
  message: string;
  showSpinner?: boolean;
}) => (
  <div className={styles.infoStateContainer}>
    {showSpinner && <div className={styles.spinner}></div>}
    <p>{message}</p>
  </div>
);

const TokenManagementCard = ({
  token,
  mintInfo,
  onManageClick,
}: {
  token: RichToken;
  mintInfo: Mint;
  onManageClick: (mint: string, type: "mint" | "freeze", programId: string) => void;
}) => {
  const { publicKey } = useWallet();
  const { getExplorerUrl } = useCluster();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const isMintAuthority = Boolean(
    mintInfo.mintAuthority && publicKey && mintInfo.mintAuthority.equals(publicKey)
  );
  const isFreezeAuthority = Boolean(
    mintInfo.freezeAuthority && publicKey && mintInfo.freezeAuthority.equals(publicKey)
  );

  const mintRevoked = !mintInfo.mintAuthority;
  const freezeRevoked = !mintInfo.freezeAuthority;
  const securityScore = (mintRevoked ? 50 : 0) + (freezeRevoked ? 50 : 0);

  const totalSupplyUi = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
  const standardLabel =
    token.programId === TOKEN_2022_PROGRAM_ID.toBase58() ? "Token-2022" : "SPL";

  const handleCopyMint = () => {
    navigator.clipboard?.writeText(token.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.tokenCard}>
      <div className={styles.tokenHeaderRow}>
        <div className={styles.tokenInfo}>
          <Image
            src={token.logoURI || "/favicon.ico"}
            alt={token.name}
            width={52}
            height={52}
            className={styles.tokenImage}
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/favicon.ico";
            }}
          />
          <div>
            <h4 className={styles.tokenName}>
              {token.name} ({token.symbol})
            </h4>
            <p className={styles.tokenSymbol}>
              {standardLabel} · {mintInfo.decimals} Dec · Supply:{" "}
              {totalSupplyUi.toLocaleString()}
            </p>
            <div className={styles.mintLinksRow}>
              <a
                href={getExplorerUrl("token", token.mint)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.solscanLink}
              >
                {token.mint.slice(0, 8)}...{token.mint.slice(-6)} ↗
              </a>
              <button type="button" onClick={handleCopyMint} className={styles.copyMintBtn}>
                {copied ? t.common.copied : t.common.copy}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.securityScoreBox}>
        <div className={styles.securityScoreHeader}>
          <strong>{t.dashboardPage.securityScoreTitle}</strong>
          <span
            className={
              securityScore === 100
                ? styles.scoreBadgeHigh
                : securityScore === 50
                  ? styles.scoreBadgeMed
                  : styles.scoreBadgeLow
            }
          >
            {securityScore}% —{" "}
            {securityScore === 100
              ? t.dashboardPage.scoreFull
              : securityScore === 50
                ? t.dashboardPage.scorePartial
                : t.dashboardPage.scoreActive}
          </span>
        </div>
        <div className={styles.scoreProgressTrack}>
          <div className={styles.scoreProgressFill} style={{ width: `${securityScore}%` }} />
        </div>
      </div>

      <div className={styles.authorityGrid}>
        <div className={styles.authorityBox}>
          <div className={styles.authorityBoxTop}>
            <strong>{t.dashboardPage.mintAuthTitle}</strong>
            {mintRevoked ? (
              <span className={styles.statusRevoked}>{t.dashboardPage.statusRevoked}</span>
            ) : (
              <span className={styles.statusActive}>{t.dashboardPage.statusActive}</span>
            )}
          </div>
          <p>{mintRevoked ? t.dashboardPage.mintRevokedDesc : t.dashboardPage.mintActiveDesc}</p>
        </div>

        <div className={styles.authorityBox}>
          <div className={styles.authorityBoxTop}>
            <strong>{t.dashboardPage.freezeAuthTitle}</strong>
            {freezeRevoked ? (
              <span className={styles.statusRevoked}>{t.dashboardPage.statusRevoked}</span>
            ) : (
              <span className={styles.statusActive}>{t.dashboardPage.statusActive}</span>
            )}
          </div>
          <p>
            {freezeRevoked ? t.dashboardPage.freezeRevokedDesc : t.dashboardPage.freezeActiveDesc}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        {isMintAuthority && (
          <Button
            className="secondary"
            onClick={() => onManageClick(token.mint, "mint", token.programId)}
          >
            {t.dashboardPage.revokeMintBtn} ({SERVICE_FEE_MANAGE_AUTHORITY_SOL.toFixed(2)} SOL)
          </Button>
        )}
        {isFreezeAuthority && (
          <Button
            className="secondary"
            onClick={() => onManageClick(token.mint, "freeze", token.programId)}
          >
            {t.dashboardPage.revokeFreezeBtn} ({SERVICE_FEE_MANAGE_AUTHORITY_SOL.toFixed(2)} SOL)
          </Button>
        )}
        <Link href={`/add-liquidity?mint=${token.mint}`} className={styles.lpLinkBtn}>
          {t.dashboardPage.goToLpBtn}
        </Link>
      </div>
    </div>
  );
};

const AuthorityCardSkeleton = () => (
  <div className={styles.skeletonCard} aria-busy="true">
    <div className={styles.skeletonHeaderRow}>
      <div className={styles.skeletonCircle} />
      <div className={styles.skeletonLines}>
        <div className={styles.skeletonBarLg} />
        <div className={styles.skeletonBarSm} />
      </div>
    </div>
    <div className={styles.skeletonAuditRows}>
      <div className={styles.skeletonAuditBox} />
      <div className={styles.skeletonAuditBox} />
    </div>
  </div>
);

function DashboardPageInner() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { cluster, setCluster } = useCluster();
  const { t } = useLanguage();
  const { tokens: userTokens, isLoading: isLoadingUserTokens } = useUserTokens();
  const {
    manageAuthority,
    isLoading: isManagingAuthority,
    statusStep,
    progressStep,
    error: manageAuthorityError,
    reset: resetManageAuthority,
  } = useManageAuthority();

  const [selectedTokenMint, setSelectedTokenMint] = useState<string>("");
  const [mintInfo, setMintInfo] = useState<Mint | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const [notification, setNotification] = useState<NotificationState>(null);
  const [modalState, setModalState] = useState<AuthorityModalState>({
    isOpen: false,
    mint: null,
    type: null,
    programId: null,
  });

  const selectedToken = useMemo(
    () => userTokens.find((tk) => tk.mint === selectedTokenMint),
    [userTokens, selectedTokenMint]
  );

  useEffect(() => {
    const fetchMintInfo = async () => {
      if (!selectedTokenMint || !connection) return;

      setIsFetchingInfo(true);
      setMintInfo(null);
      try {
        const mintPublicKey = new PublicKey(selectedTokenMint);
        const accountInfo = await connection.getAccountInfo(mintPublicKey);
        const programId = accountInfo?.owner;

        if (
          !programId ||
          (programId.toBase58() !== TOKEN_PROGRAM_ID.toBase58() &&
            programId.toBase58() !== TOKEN_2022_PROGRAM_ID.toBase58())
        ) {
          throw new Error("Unknown token program.");
        }

        const info = await getMint(connection, mintPublicKey, "confirmed", programId);
        setMintInfo(info);
      } catch (err) {
        console.error("Failed to fetch mint info:", err);
      } finally {
        setIsFetchingInfo(false);
      }
    };

    fetchMintInfo();
  }, [selectedTokenMint, connection]);

  const handleManageAuthorityClick = (
    mint: string,
    type: "mint" | "freeze",
    programId: string
  ) => {
    setModalState({ isOpen: true, mint, type, programId });
  };

  const handleConfirmManageAuthority = async () => {
    if (!modalState.mint || !modalState.type || !modalState.programId) return;

    const targetMint = modalState.mint;
    const targetType = modalState.type;
    const targetProgramId = modalState.programId;

    setModalState({ isOpen: false, mint: null, type: null, programId: null });
    setNotification(null);
    resetManageAuthority();

    const signature = await manageAuthority(targetMint, targetType, targetProgramId);

    if (signature) {
      setNotification({
        type: "success",
        message: `✓ ${targetType === "mint" ? "Mint" : "Freeze"} Authority (${cluster})`,
        txId: signature,
      });
      const mintPublicKey = new PublicKey(targetMint);
      const programId = new PublicKey(targetProgramId);
      const info = await getMint(connection, mintPublicKey, "confirmed", programId);
      setMintInfo(info);
    } else {
      setNotification({
        type: "error",
        message: manageAuthorityError || "Failed to revoke authority.",
      });
    }
  };

  const renderContent = () => {
    if (!publicKey) return <InfoState message={t.dashboardPage.connectPrompt} />;
    if (isLoadingUserTokens) {
      return (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonSelectorGrid}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.skeletonTokenChip}>
                <div className={styles.skeletonCircle} style={{ width: 28, height: 28 }} />
                <div className={styles.skeletonLines}>
                  <div className={styles.skeletonBarLg} />
                  <div className={styles.skeletonBarSm} />
                </div>
              </div>
            ))}
          </div>
          <AuthorityCardSkeleton />
        </div>
      );
    }

    return (
      <div className={styles.managementContainer}>
        <TransactionStatusStepper
          isActive={isManagingAuthority}
          currentStepIndex={progressStep}
          statusMessage={statusStep}
          operationTitle={`${t.common.signingAndConfirming} (${cluster})`}
        />

        <div className={styles.field}>
          <label htmlFor="token-select">{t.dashboardPage.step1SelectLabel}</label>
          <TokenSelector
            tokens={userTokens}
            selectedTokenMint={selectedTokenMint}
            onSelectToken={setSelectedTokenMint}
            isLoading={isLoadingUserTokens}
            disabled={isManagingAuthority}
          />
        </div>

        {isFetchingInfo && <AuthorityCardSkeleton />}

        {mintInfo && selectedToken && (
          <TokenManagementCard
            token={selectedToken}
            mintInfo={mintInfo}
            onManageClick={handleManageAuthorityClick}
          />
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          txId={notification.txId}
          onClose={() => setNotification(null)}
        />
      )}

      <header className={styles.pageHeader}>
        <div className={styles.topNetworkRow}>
          <div className={styles.networkPillGroup}>
            <span>{t.common.activeNetwork}</span>
            <button
              type="button"
              onClick={() => setCluster("mainnet-beta")}
              className={cluster === "mainnet-beta" ? styles.netBtnMainnet : styles.netBtnInactive}
            >
              ● Mainnet-Beta
            </button>
            <button
              type="button"
              onClick={() => setCluster("devnet")}
              className={cluster === "devnet" ? styles.netBtnDevnet : styles.netBtnInactive}
            >
              ● Devnet
            </button>
          </div>
          <span className={styles.feeBadgeTop}>
            {t.dashboardPage.feeBadgeLabel}{" "}
            <strong>{SERVICE_FEE_MANAGE_AUTHORITY_SOL.toFixed(2)} SOL</strong>
          </span>
        </div>

        <h1 className={styles.pageTitle}>{t.dashboardPage.pageTitle}</h1>
        <p className={styles.pageDescription}>{t.dashboardPage.pageDesc}</p>
      </header>

      <div className={styles.grid}>
        <main className={styles.mainContent}>
          <Card>
            <CardHeader>
              <CardTitle>
                {t.dashboardPage.panelTitle} ({cluster})
              </CardTitle>
              <CardDescription>{t.dashboardPage.panelDesc}</CardDescription>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
          </Card>
        </main>

        <aside className={styles.sidebar}>
          <CostSummary operation="manageAuthority" />

          {t.dashboardPage.guideSections.map((section, index) => (
            <Card key={index} className={styles.guideCard}>
              <CardContent className={styles.guideCardContent}>
                <div className={styles.guideIcon}>{GUIDE_ICONS[index]}</div>
                <div>
                  <p className={styles.guideTitle}>{section.title}</p>
                  <p className={styles.guideDescription}>{section.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </aside>
      </div>

      <ManageAuthorityModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mint: null, type: null, programId: null })}
        onConfirm={handleConfirmManageAuthority}
        title={`${t.dashboardPage.modalTitlePrefix} ${modalState.type === "mint" ? "Mint" : "Freeze"}`}
        description={`${t.dashboardPage.modalDesc} (${SERVICE_FEE_MANAGE_AUTHORITY_SOL.toFixed(2)} SOL · ${devWalletBase58.slice(0, 6)}...${devWalletBase58.slice(-4)})`}
        isLoading={isManagingAuthority}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <DashboardPageInner />
    </Suspense>
  );
}
