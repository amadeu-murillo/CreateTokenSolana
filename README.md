# CreateTokenSolana — Refactored, Hardened & On-Chain Arweave / Token-2022 Edition

Full-stack **Next.js 14 (App Router) + TypeScript + Solana Web3.js / SPL Token / Metaplex Umi** platform for launching fungible tokens (**SPL** and **Token-2022**), uploading token images and metadata JSON permanently to the **Arweave blockchain via Irys/Bundlr**, storing metadata natively on-chain via the **Token-2022 Metadata Extension (`MetadataPointer` + `TokenMetadata`)**, initializing **Liquidity Pools (Raydium CPMM & Meteora Dynamic AMM)**, burning tokens/LP (**Burn**), executing batched **Airdrops**, managing **Mint/Freeze Authorities**, and earning **10% atomic SOL affiliate commissions** across both **Solana Mainnet-Beta** and **Solana Devnet**.

## Key Features & Architecture

1. **Decentralized Permanent Storage on Arweave via Irys / Bundlr (`src/lib/services/arweaveService.ts` & `src/hooks/useArweaveUpload.ts`)**:
   - Supports **Client-Side Wallet-Signed Irys Uploads** (`walletAdapterIdentity` + `bundlrUploader`) and **Server-Side Irys Uploads** (`IRYS_UPLOADER_PRIVATE_KEY`) on both **Mainnet-Beta (`https://node1.irys.xyz`)** and **Devnet (`https://devnet.irys.xyz`)**.
   - Permanently stores both the token logo image and the Metaplex-standard JSON on Arweave (`https://arweave.net/<tx_id>`), with optional fallback to Cloudinary if desired.
2. **Native On-Chain Token-2022 Metadata Extension (`src/lib/services/token2022Service.ts`)**:
   - Implements `ExtensionType.MetadataPointer` pointing directly to the Mint account itself (`createInitializeMetadataPointerInstruction`), combined with `spl_token_metadata_interface` (`initialize_account` and `updating_field` instructions).
   - Stores `name`, `symbol`, `uri` (Arweave TX URI), and custom `additionalMetadata` (`description`, `website`, `twitter`, `instagram`) **100% inside the Token-2022 Mint account on the Solana blockchain**, pre-funding exact TLV rent-exemption lamports.
3. **Token Creator as Default Home Page (`/`) & Dual-Cluster Switcher (`Mainnet-Beta` & `Devnet`)**:
   - Instant header network toggle (`useCluster` in `src/context/WalletContext.tsx`) switching RPC endpoints, Irys nodes, Raydium CPMM / Meteora DAMM Program IDs, and Solscan explorer URLs (`?cluster=devnet`).
4. **Liquidity Pool Creation (`/add-liquidity` & `/api/create-liquidity-pool`)**:
   - Supports **Raydium CPMM** and **Meteora Dynamic AMM** paired with **SOL (WSOL)** or **USDC**, automatic WSOL wrapping (`SyncNative`), optional atomic `FreezeAuthority` revocation in the same transaction, and a live Initial Price & Market Cap simulator.
5. **Security & Precision Hardening (`src/lib/security.ts`)**:
   - Exact string-to-`BigInt` conversion (`toRawTokenAmount`), binary magic-byte image inspection (`validateImageBuffer`), on-chain affiliate transaction verification (`getParsedTransaction`) with deterministic Firestore IDs, sliding-window rate limiting, and HTTP security headers.

## Getting Started

1. Copy `.env.example` to `.env.local` and configure your environment variables:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
## Affiliate Earnings — Firestore Composite Indexes & Reconciliation

The `/api/affiliate-earnings` endpoint uses Firestore server-side aggregations (`getAggregateFromServer` with `sum` and `count`), period filtering (`range=7d|30d|90d|all`), cursor pagination (`orderBy("createdAt", "desc")`), and top-commission lookup. Create the following composite indexes on the `affiliate_commissions` collection:

1. **Paginated history & period filter**
   - Collection: `affiliate_commissions`
   - Fields: `affiliateWallet` (Ascending), `createdAt` (Descending)
2. **Highest commission KPI (all-time)**
   - Collection: `affiliate_commissions`
   - Fields: `affiliateWallet` (Ascending), `commissionAmountSOL` (Descending)
3. **Highest commission KPI (with period filter)**
   - Collection: `affiliate_commissions`
   - Fields: `affiliateWallet` (Ascending), `createdAt` (Ascending), `commissionAmountSOL` (Descending)

### Missing Commission Retry & Optional On-Chain Reconciliation
- Client transactions post to `/api/record-commission` via `recordCommissionWithRetry` (3 attempts with exponential backoff). If transient failures persist, the payload is stored in `localStorage` (`pendingAffiliateCommissions`) and flushed automatically on the next visit by `AffiliateTracker`.
- For full server-side reconciliation (e.g., if a user closes the browser before the POST fires), schedule a periodic job or protected admin endpoint that calls `connection.getSignaturesForAddress(affiliateWallet)` for recent confirmed signatures, filters transactions that also include `DEV_WALLET_ADDRESS_STRING`, and replays them into the existing `/api/record-commission` on-chain split verifier (idempotent via `409` deduplication).
