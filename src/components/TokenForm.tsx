"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { createToken } from "@/lib/token";

export default function TokenForm() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [status, setStatus] = useState("");

  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, connected } = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      alert("Conecte sua carteira antes!");
      return;
    }

    try {
      setStatus("⏳ Criando token...");
      const mintAddress = await createToken(
        connection,
        { publicKey, signTransaction },
        decimals,
        parseInt(supply)
      );
      setStatus(`✅ Token criado: ${mintAddress}`);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Erro: " + err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 bg-white p-6 rounded-lg shadow"
    >
      <input
        type="text"
        placeholder="Nome do Token"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Símbolo"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        maxLength={8}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        placeholder="Decimais"
        value={decimals}
        onChange={(e) => setDecimals(Number(e.target.value))}
        min={0}
        max={9}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        placeholder="Fornecimento Total"
        value={supply}
        onChange={(e) => setSupply(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Criar Token
      </button>

      {status && <p className="mt-2">{status}</p>}
    </form>
  );
}
