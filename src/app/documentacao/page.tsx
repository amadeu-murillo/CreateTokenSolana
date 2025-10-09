"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import styles from './Documentation.module.css';

// Ícones SVG para clareza
const IconPlusCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const IconFlame = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const IconSend = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73 2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconBookOpen = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const IconLayers = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;

const documentationSections = [
    {
        icon: <IconPlusCircle />,
        title: "Token Creation (SPL and Token-2022)",
        id: "criar-token",
        summary: "Learn how to create your own fungible token on Solana by defining its essential properties and metadata.",
        details: [
            "The token creation process allows you to launch a digital asset on the Solana blockchain. Our platform simplifies this process into a few steps:",
            {
                type: 'list',
                items: [
                    "<strong>Token Details:</strong> Define the <strong>Name</strong> (e.g., 'Moon Coin'), <strong>Symbol</strong> (e.g., 'MOON'), <strong>Decimals</strong> (usually 9 for fractional amounts), and the <strong>Total Supply</strong> (the total number of tokens that will exist).",
                    "<strong>Metadata (Image):</strong> The image of your token is crucial for its visual identity. We upload it to a decentralized service and link it to your token using the Metaplex standard, ensuring it appears correctly in wallets and explorers.",
                    "<strong>Token Standard:</strong> You can choose between the <strong>Standard SPL</strong> (ideal for most cases) and <strong>Token-2022</strong>, which offers advanced features like transfer fees (tax on transfer).",
                    "<strong>Authorities:</strong> The 'Authority Options' are vital for trust and decentralization. By unchecking the 'Mint Authority', your token supply becomes fixed and immutable. Unchecking the 'Freeze Authority' prevents anyone from freezing tokens in wallets — a common practice for decentralized projects.",
                    "<strong>Confirmation:</strong> After filling everything out, approve a single transaction in your wallet. We handle all the blockchain technical complexity for you."
                ]
            }
        ]
    },
    {
        icon: <IconLayers />,
        title: "Liquidity Pool Creation",
        id: "criar-liquidez",
        summary: "Allow your token to be publicly traded by creating a market on a decentralized exchange (DEX).",
        details: [
            "A token without liquidity cannot be bought or sold. Creating a liquidity pool is an essential step to give your asset value and utility.",
            {
                type: 'list',
                items: [
                  "<strong>What is a Pool?:</strong> It’s a pair of two assets (in this case, your token and SOL) locked in a smart contract on a DEX such as Meteora. This creates a market where people can swap one for the other.",
                  "<strong>Setting the Initial Price:</strong> The ratio of tokens and SOL you initially deposit defines the launch price. For example, if you deposit 1,000,000 of your token and 10 SOL, each token’s starting price will be 0.00001 SOL.",
                  "<strong>Our Tool:</strong> On the 'Liquidity' page, select your token, the amount you want to deposit, and the corresponding amount of SOL. We automatically create and initialize the pool on Meteora for you.",
                  "<strong>Fees:</strong> This process involves multiple blockchain transactions, so it has a higher network cost plus our service fee."
                ]
            }
        ]
    },
    {
        icon: <IconFlame />,
        title: "Token Burning",
        id: "queimar-tokens",
        summary: "Reduce your token’s total supply by permanently removing it from circulation.",
        details: [
            "Token burning is a deflationary strategy. By reducing the total number of existing tokens, you can theoretically increase the scarcity and value of the remaining ones.",
             {
                type: 'list',
                items: [
                    "<strong>Irreversible Action:</strong> Once a token is burned, it’s destroyed forever and cannot be recovered.",
                    "<strong>How to Do It:</strong> On the 'Burn' page, simply select the token from your wallet, enter the amount to burn, and approve the transaction. The total supply reflected on the blockchain will be updated."
                ]
            }
        ]
    },
    {
        icon: <IconSend />,
        title: "Mass Distribution (Airdrop)",
        id: "airdrop",
        summary: "Send your token to hundreds or thousands of wallets in a single transaction.",
        details: [
            "Airdrops are a powerful tool for marketing, community engagement, and initial token distribution.",
            {
                type: 'list',
                items: [
                    "<strong>List Format:</strong> Prepare a simple text list where each line contains the recipient’s wallet address and amount, separated by a comma, space, or semicolon.",
                    "<strong>Smart Validation:</strong> Our tool validates your list to ensure all addresses are valid and amounts are correct, preventing errors and fund loss.",
                    "<strong>Account Creation (ATA):</strong> A major advantage of our platform is that if a recipient doesn’t yet have an account for your token, we automatically create it for them within the same transaction — ensuring a successful airdrop.",
                    "<strong>Efficiency:</strong> All transfers are grouped into a single transaction, saving time and network fees."
                ]
            }
        ]
    },
    {
        icon: <IconSettings />,
        title: "Authority Management",
        id: "gerenciar-tokens",
        summary: "View the tokens you’ve created and renounce Mint and Freeze authorities to increase decentralization.",
        details: [
            "The Management Dashboard is your control center for tokens created through our platform.",
            {
                type: 'list',
                items: [
                    "<strong>Visualization:</strong> The page lists all tokens where your connected wallet still holds Mint or Freeze authority.",
                    "<strong>Renounce Authority:</strong> Renouncing these authorities is a permanent action and a strong sign of trust for your community. It means you can no longer mint new tokens (if you renounce Mint) or freeze funds (if you renounce Freeze).",
                    "<strong>How to Do It:</strong> Simply select the token and click the corresponding button to remove the authority. You’ll need to approve a wallet transaction to confirm the action."
                ]
            }
        ]
    },
    {
        icon: <IconDollarSign />,
        title: "Affiliate Program",
        id: "afiliados",
        summary: "Earn SOL commissions by referring new users to our platform.",
        details: [
            "Our affiliate program is designed to be simple, transparent, and profitable.",
            {
                type: 'list',
                items: [
                    "<strong>Exclusive Link:</strong> When you connect your wallet on the 'Affiliates' page, a referral link is generated using your public key as an identifier (`?ref=YOUR_WALLET`).",
                    "<strong>10% Commission:</strong> You receive 10% of our service fee (0.01 SOL) for every token created by a user who came through your link.",
                    "<strong>Atomic Payment:</strong> The commission is transferred to your wallet in the same transaction in which the referred user’s token is created. This happens securely and automatically on-chain, ensuring you receive your earnings instantly.",
                    "<strong>Earnings Dashboard:</strong> You can track your total earnings, number of referrals, and view your latest commissions with direct links to transactions on Solscan."
                ]
            }
        ]
    }
];

export default function DocumentationPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <IconBookOpen />
        <h1 className={styles.title}>Platform Documentation</h1>
        <p className={styles.subtitle}>
          A complete guide to using all CreateTokenSolana features.
        </p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <nav className={styles.toc}>
            <h3 className={styles.tocTitle}>Navigation</h3>
            <ul>
              {documentationSections.map(section => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.icon}
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className={styles.content}>
          {documentationSections.map(section => (
            <section key={section.id} id={section.id} className={styles.section}>
              <Card>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>{section.title}</CardTitle>
                  <CardDescription className={styles.sectionSummary}>{section.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={styles.detailsContainer}>
                    {section.details.map((detail, index) => {
                      if (typeof detail === 'string') {
                        return <p key={index}>{detail}</p>;
                      }
                      if (detail.type === 'list') {
                        return (
                          <ul key={index} className={styles.detailsList}>
                            {detail.items.map((item, itemIndex) => (
                              <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
                            ))}
                          </ul>
                        );
                      }
                      return null;
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
