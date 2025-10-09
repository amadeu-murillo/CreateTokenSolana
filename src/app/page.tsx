"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import styles from "./Home.module.css";
import { JSX } from "react";

// --- Ícones como Componentes ---
const IconWallet = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckSquare = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IconGift = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;

// --- Componente: HeroSection ---
const HeroSection = () => (
  <div className={styles.heroWrapper}>
    <div className={styles.container}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>Launch Your Token on Solana in Minutes</h1>
        <p className={styles.description}>
          Create your SPL token without complications. Connect your wallet, set up the details, and launch it safely and transparently. Perfect for communities, projects, and developers.
        </p>
        <div className={styles.buttonContainer}>
          <Link href="/create">
            <Button>
              Create My Token Now
            </Button>
          </Link>
          <Link href="/documentacao">
            <Button className={styles.secondaryButton}>
              View Documentation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

// --- Componente: FeatureCard ---
const FeatureCard = ({ icon, title, description, href }: { icon: JSX.Element; title: string; description: string; href?: string }) => {
  const content = (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
};

// --- Componente: FeaturesSection ---
const FeaturesSection = () => (
  <section className={styles.featuresSection}>
    <h2 className={styles.sectionTitle}>Comprehensive Features</h2>
    <p className={styles.sectionDescription}>Everything you need to manage your SPL token in one place.</p>
    <div className={styles.featuresGrid}>
        <FeatureCard icon={<IconPlusCircle />} title="Token Creation" description="Launch your own SPL token on the Solana network with complete metadata, including name, symbol, and image." href="/create"/>
        <FeatureCard icon={<IconLayers />} title="Create Liquidity Pool" href="/add-liquidity" description="Create a liquidity pool on Raydium so your token can be traded by other users." />
        <FeatureCard icon={<IconFlame />} title="Token Burn" description="Permanently remove tokens from circulation to control supply and increase scarcity." href="/burn" />
        <FeatureCard icon={<IconSend />} title="Airdrop Distribution" description="Distribute your tokens to multiple addresses at once — ideal for marketing campaigns and rewards." href="/airdrop" />
        <FeatureCard icon={<IconSettings />} title="Authority Management" description="Have full control over your token with the option to renounce 'mint' and 'freeze' authorities." href="/dashboard"/>
        <FeatureCard icon={<IconDollarSign />} title="Affiliate Program" href="/afiliates" description="Earn SOL by referring new users. Generate your affiliate link and receive commissions for each token created." />
    </div>
  </section>
);

// --- Componente: HowItWorksSection ---
const HowItWorksSection = () => (
  <section className={styles.howItWorksSection}>
    <h2 className={styles.sectionTitle}>How It Works</h2>
    <div className={styles.stepsGrid}>
      <div className={styles.step}>
        <div className={styles.stepIcon}><IconWallet /></div>
        <h3>1. Connect Your Wallet</h3>
        <p>Connect your preferred Solana wallet (Phantom, Solflare,etc.).</p>
      </div>
      <div className={styles.step}>
        <div className={styles.stepIcon}><IconFileText /></div>
        <h3>2. Fill in the Details</h3>
        <p>Set the name, symbol, image, and total supply of your token.</p>
      </div>
      <div className={styles.step}>
        <div className={styles.stepIcon}><IconCheckSquare /></div>
        <h3>3. Confirm the Transaction</h3>
        <p>Approve the transaction in your wallet to create the token on the blockchain.</p>
      </div>
      <div className={styles.step}>
        <div className={styles.stepIcon}><IconGift /></div>
        <h3>4. Receive Your Tokens</h3>
        <p>Your new tokens are instantly sent to your wallet.</p>
      </div>
    </div>
  </section>
);

// --- Componente: SocialProofSection ---
const SocialProofSection = () => (
    <section className={styles.socialProofSection}>
        <h2 className={styles.sectionTitle}>Join Hundreds of Creators</h2>
        <p className={styles.sectionDescription}>Our platform has already been used to launch amazing projects. Be the next one!</p>
        <div className={styles.statsGrid}>
            <div className={styles.statCard}>
                <p className={styles.statValue}>+250</p>
                <p className={styles.statLabel}>Tokens Created</p>
            </div>
            <div className={styles.statCard}>
                <p className={styles.statValue}>+150</p>
                <p className={styles.statLabel}>Projects Launched</p>
            </div>
            <div className={styles.statCard}>
                <p className={styles.statValue}>+600</p>
                <p className={styles.statLabel}>Transactions Completed</p>
            </div>
        </div>
    </section>
);

// --- Componente: FaqSection ---
const FaqSection = () => (
  <section className={styles.faqSection} id="faq">
    <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
    <div className={styles.faqGrid}>
      <details className={styles.faqItem}>
        <summary><h3>Do I really own the token?</h3></summary>
        <p>Absolutely. The "mint" (create new tokens) and "freeze" (freeze accounts) authorities are yours. You have full control over the created token and can renounce these authorities at any time.</p>
      </details>
      <details className={styles.faqItem}>
        <summary><h3>Does the platform store any private keys?</h3></summary>
        <p>No. Never. All transactions are securely signed within your own wallet. We never have access to your keys or funds.</p>
      </details>
      <details className={styles.faqItem}>
        <summary><h3>What makes up the total cost?</h3></summary>
        <p>The total cost includes the Solana network rent fee (to make the token account permanent), a small transaction fee, and our service fee. <Link href="/costs" className={styles.faqLink}>See details</Link>.</p>
      </details>
      <details className={styles.faqItem}>
        <summary><h3>Can I create a token for my community?</h3></summary>
        <p>Yes! SPL tokens are perfect for communities, game projects, DAOs, loyalty programs, and much more. Use your creativity!</p>
      </details>
    </div>
  </section>
);

// --- Componente Principal da Página ---
export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <FaqSection />
    </>
  );
}
