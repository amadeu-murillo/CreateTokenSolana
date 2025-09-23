import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Create Token Solana",
  description: "App para criar tokens SPL na blockchain Solana",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">
        <header className="p-4 border-b shadow-sm bg-white">
          <h1 className="text-xl font-bold">Create Token Solana</h1>
        </header>
        <main className="p-6">{children}</main>
        <footer className="p-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CreateTokenSolana
        </footer>
      </body>
    </html>
  );
}
