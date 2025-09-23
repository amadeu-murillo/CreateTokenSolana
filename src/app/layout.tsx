import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { WalletProvider } from "@/context/WalletProvider";
import ConnectWallet from "@/components/ConnectWallet";

export const metadata = {
  title: "Create Token Solana",
  description: "App para criar tokens SPL na blockchain Solana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans antialiased">
        <WalletProvider>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <div className="mr-4 flex items-center">
                  <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="font-bold">🚀 CreateToken</span>
                  </Link>
                  <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/create">Criar Token</Link>
                    <Link href="/costs">Custos</Link>
                    <Link href="/settings">Configurações</Link>
                  </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-4">
                  <ConnectWallet />
                </div>
              </div>
            </header>
            <main className="flex-1 container py-8">{children}</main>
            <footer className="py-6 md:px-8 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} CreateTokenSolana
                </p>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
