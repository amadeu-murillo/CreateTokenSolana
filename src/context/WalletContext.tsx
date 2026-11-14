"use client";

import React, {
  FC,
  useMemo,
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  SolanaCluster,
  getRpcEndpoint,
  getSolscanUrl,
} from "@/lib/constants";
import "@solana/wallet-adapter-react-ui/styles.css";

interface ClusterContextValue {
  cluster: SolanaCluster;
  setCluster: (cluster: SolanaCluster) => void;
  rpcEndpoint: string;
  getExplorerUrl: (type: "tx" | "token" | "account", id: string) => string;
}

const ClusterContext = createContext<ClusterContextValue>({
  cluster: "mainnet-beta",
  setCluster: () => {},
  rpcEndpoint: getRpcEndpoint("mainnet-beta"),
  getExplorerUrl: (type, id) => getSolscanUrl(type, id, "mainnet-beta"),
});

export const useCluster = () => useContext(ClusterContext);

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [cluster, setClusterState] = useState<SolanaCluster>("mainnet-beta");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("solanaCluster") as SolanaCluster | null;
      if (saved === "mainnet-beta" || saved === "devnet") {
        setClusterState(saved);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const setCluster = useCallback((nextCluster: SolanaCluster) => {
    setClusterState(nextCluster);
    try {
      localStorage.setItem("solanaCluster", nextCluster);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const endpoint = useMemo(() => getRpcEndpoint(cluster), [cluster]);

  const getExplorerUrl = useCallback(
    (type: "tx" | "token" | "account", id: string) =>
      getSolscanUrl(type, id, cluster),
    [cluster]
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const contextValue = useMemo(
    () => ({
      cluster,
      setCluster,
      rpcEndpoint: endpoint,
      getExplorerUrl,
    }),
    [cluster, setCluster, endpoint, getExplorerUrl]
  );

  return (
    <ClusterContext.Provider value={contextValue}>
      <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed", disableRetryOnRateLimit: true, confirmTransactionInitialTimeout: 45000 }}>
        <SolanaWalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    </ClusterContext.Provider>
  );
};
